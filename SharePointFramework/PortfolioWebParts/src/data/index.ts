import { format } from '@fluentui/react/lib/Utilities'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { dateAdd, PnPClientStorage, TypedHash } from '@pnp/common'
import { ItemUpdateResult, QueryPropertyValueType, SearchResult, SortDirection, sp } from '@pnp/sp'
import * as cleanDeep from 'clean-deep'
import { IGraphGroup, IPortfolioConfiguration, ISPProjectItem, ISPUser } from 'interfaces'
import { IAggregatedListConfiguration } from 'interfaces/IAggregatedListConfiguration'
import msGraph from 'msgraph-helper'
import * as strings from 'PortfolioWebPartsStrings'
import { isNull } from 'pp365-shared/lib/helpers'
import { getUserPhoto } from 'pp365-shared/lib/helpers/getUserPhoto'
import { DataSource, PortfolioOverviewView, ProjectColumn } from 'pp365-shared/lib/models'
import { DataSourceService } from 'pp365-shared/lib/services/DataSourceService'
import { PortalDataService } from 'pp365-shared/lib/services/PortalDataService'
import HubSiteService from 'sp-hubsite-service'
import _, { any, find, first } from 'underscore'
import {
  Benefit,
  BenefitMeasurement,
  BenefitMeasurementIndicator,
  ChartConfiguration,
  ChartData,
  ChartDataItem,
  DataField,
  ProjectListModel,
  SPChartConfigurationItem,
  SPContentType,
  SPTimelineConfigurationItem,
  TimelineConfigurationModel,
  TimelineContentModel
} from '../models'
import { IFetchDataForViewItemResult } from './IFetchDataForViewItemResult'
import {
  CONTENT_TYPE_ID_BENEFITS,
  CONTENT_TYPE_ID_INDICATORS,
  CONTENT_TYPE_ID_MEASUREMENTS,
  DEFAULT_GAINS_PROPERTIES,
  DEFAULT_SEARCH_SETTINGS,
  IDataAdapter
} from './types'

export class DataAdapter implements IDataAdapter {
  private _portalDataService: PortalDataService
  public dataSourceService: DataSourceService

  constructor(public context: WebPartContext, private siteIds?: string[]) {
    this._portalDataService = new PortalDataService().configure({
      urlOrWeb: context.pageContext.web.absoluteUrl
    })
  }

  /**
   * Configuring the DataAdapter enabling use
   * of the `DataSourceService`.
   */
  public async configure(): Promise<DataAdapter> {
    if (this.dataSourceService) return this
    const { web } = await HubSiteService.GetHubSite(sp, this.context.pageContext as any)
    this.dataSourceService = new DataSourceService(web)
    return this
  }

  /**
   * Fetch chart data
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param chartConfigurationListName List name for chart configuration
   * @param siteId Site ID
   */
  public async fetchChartData(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    chartConfigurationListName: string,
    siteId: string
  ) {
    try {
      const [chartItems, contentTypes] = await Promise.all([
        sp.web.lists
          .getByTitle(chartConfigurationListName)
          .items.select(...Object.keys(new SPChartConfigurationItem()))
          .get<SPChartConfigurationItem[]>(),
        sp.web.lists
          .getByTitle(chartConfigurationListName)
          .contentTypes.select(...Object.keys(new SPContentType()))
          .get<SPContentType[]>()
      ])
      const charts: ChartConfiguration[] = chartItems.map((item) => {
        const fields = item.GtPiFieldsId.map((id) => {
          const fld = _.find(configuration.columns, (f) => f.id === id)
          return new DataField(fld.name, fld.fieldName, fld.dataType)
        })
        const chart = new ChartConfiguration(item, fields)
        return chart
      })
      const items = (await this.fetchDataForView(view, configuration, siteId)).map(
        (i) => new ChartDataItem(i.Title, i)
      )
      const chartData = new ChartData(items)

      return {
        charts,
        chartData,
        contentTypes
      }
    } catch (error) {
      throw error
    }
  }

  public async getPortfolioConfig(): Promise<IPortfolioConfiguration> {
    // eslint-disable-next-line prefer-const
    let [columnConfig, columns, views, viewsUrls, columnUrls] = await Promise.all([
      this._portalDataService.getProjectColumnConfig(),
      this._portalDataService.getProjectColumns(),
      this._portalDataService.getPortfolioOverviewViews(),
      this._portalDataService.getListFormUrls('PORTFOLIO_VIEWS'),
      this._portalDataService.getListFormUrls('PROJECT_COLUMNS')
    ])
    columns = columns.map((col) => col.configure(columnConfig))
    const refiners = columns.filter((col) => col.isRefinable)
    views = views.map((view) => view.configure(columns))
    return {
      columns,
      refiners,
      views,
      viewsUrls,
      columnUrls
    }
  }

  /**
   * Get aggregated list config
   *
   * @param category Category
   */
  public async getAggregatedListConfig(category: string): Promise<IAggregatedListConfiguration> {
    let portal = this._portalDataService

    try {
      if (category.includes('(Prosjektnivå)') || !category) {
        const { web } = await HubSiteService.GetHubSite(sp, this.context.pageContext as any)
        portal = new PortalDataService().configure({ urlOrWeb: web })
      }
      const [views, viewsUrls, columnUrls] = await Promise.all([
        await this.configure().then((adapter) => {
          return adapter.fetchDataSources(category)
        }),
        portal.getListFormUrls('DATA_SOURCES'),
        portal.getListFormUrls('PROJECT_CONTENT_COLUMNS')
      ])
      return {
        views,
        viewsUrls,
        columnUrls
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Fetch data for view
   *
   * @description Used by PortfolioOverview and PortfolioInsights
   *
   * @param view
   * @param configuration
   * @param siteId
   * @returns {Promise<IFetchDataForViewItemResult[]>}
   */
  public async fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    siteId: string
  ): Promise<IFetchDataForViewItemResult[]> {
    const isCurrentUserInManagerGroup = await this.isUserInGroup(strings.PortfolioManagerGroupName)
    if (isCurrentUserInManagerGroup) {
      return await this.fetchDataForManagerView(view, configuration, siteId)
    } else {
      return await this.fetchDataForRegularView(view, configuration, siteId)
    }
  }

  /**
   * Fetch data for regular view
   *
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property
   */
  public async fetchDataForRegularView(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    siteId: string,
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IFetchDataForViewItemResult[]> {
    try {
      const { projects, sites, statusReports } = await this._fetchDataForView(
        view,
        configuration,
        siteId,
        siteIdProperty
      )
      const items = sites.map((site) => {
        const [project] = projects.filter((res) => res[siteIdProperty] === site['SiteId'])
        const [statusReport] = statusReports.filter((res) => res[siteIdProperty] === site['SiteId'])
        return {
          ...statusReport,
          ...project,
          Title: site.Title,
          Path: site.Path,
          SiteId: site['SiteId']
        }
      })

      return items
    } catch (err) {
      throw err
    }
  }

  /**
   * Fetch data for manager view
   *
   * @param view View
   * @param configuration Configuration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property (defaults to **GtSiteIdOWSTEXT**)
   */
  public async fetchDataForManagerView(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    siteId: string,
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IFetchDataForViewItemResult[]> {
    try {
      const { projects, sites, statusReports } = await this._fetchDataForView(
        view,
        configuration,
        siteId,
        siteIdProperty
      )

      const items = projects.map((project) => {
        const [statusReport] = statusReports.filter(
          (res) => res[siteIdProperty] === project[siteIdProperty]
        )
        const [site] = sites.filter((res) => res['SiteId'] === project[siteIdProperty])
        return {
          ...statusReport,
          ...project,
          Path: site && site.Path,
          SiteId: project[siteIdProperty]
        }
      })

      return items
    } catch (err) {
      throw err
    }
  }

  /**
   * Fetches data for portfolio views
   *
   * @param view View
   * @param configuration Configuration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property (defaults to **GtSiteIdOWSTEXT**)
   * @param queryArray Query array
   */
  private async _fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    siteId: string,
    siteIdProperty: string = 'GtSiteIdOWSTEXT',
    queryArray?: string
  ) {
    view
    let [
      { PrimarySearchResults: projects },
      { PrimarySearchResults: sites },
      { PrimarySearchResults: statusReports }
    ] = await Promise.all([
      sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: `${queryArray ?? ''} ${view.searchQuery} `,
        SelectProperties: [...configuration.columns.map((f) => f.fieldName), siteIdProperty]
      }),
      sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: `${queryArray ?? ''} DepartmentId:{${siteId}} contentclass:STS_Site`,
        SelectProperties: ['Path', 'Title', 'SiteId']
      }),
      sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: `${
          queryArray ?? ''
        } DepartmentId:{${siteId}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:Publisert`,
        SelectProperties: [...configuration.columns.map((f) => f.fieldName), siteIdProperty],
        Refiners: configuration.refiners.map((ref) => ref.fieldName).join(',')
      })
    ])
    projects = projects.map((item) => cleanDeep({ ...item }))
    sites = sites.map((item) => cleanDeep({ ...item }))
    statusReports = statusReports.map((item) => cleanDeep({ ...item }))
    sites = sites.filter(
      (site) => projects.filter((res) => res[siteIdProperty] === site['SiteId']).length === 1
    )

    return {
      projects,
      sites,
      statusReports
    }
  }

  /**
   * Fetches data for the Projecttimeline project
   *
   * @param timelineConfig Timeline configuration
   */
  public async fetchTimelineProjectData(timelineConfig: TimelineConfigurationModel[]) {
    try {
      const [{ PrimarySearchResults: statusReports }] = await Promise.all([
        sp.search({
          ...DEFAULT_SEARCH_SETTINGS,
          QueryTemplate: `DepartmentId:{${this.context.pageContext.legacyPageContext.hubSiteId}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:Publisert`,
          SelectProperties: [
            'Title',
            'GtSiteIdOWSTEXT',
            'GtCostsTotalOWSCURR',
            'GtBudgetTotalOWSCURR'
          ]
        })
      ])

      const configElement = _.find(timelineConfig, (col) => col.title === strings.ProjectLabel)

      const reports = statusReports
        .map((report) => {
          return {
            siteId: report && report['GtSiteIdOWSTEXT'],
            costsTotal: report && report['GtCostsTotalOWSCURR'],
            budgetTotal: report && report['GtBudgetTotalOWSCURR']
          }
        })
        .filter((p) => p)

      return { reports, configElement }
    } catch (error) {}
  }

  /**
   *  Fetches items from timelinecontent list
   *
   * * Fetching list items
   * * Maps the items to `TimelineContentListModel`
   *
   * @param timelineConfig Timeline configuration
   */
  public async fetchTimelineContentItems(timelineConfig: TimelineConfigurationModel[]) {
    const timelineItems = await sp.web.lists
      .getByTitle(strings.TimelineContentListName)
      .items.select(
        'Title',
        'GtTimelineTypeLookup/Title',
        'GtStartDate',
        'GtEndDate',
        'GtBudgetTotal',
        'GtCostsTotal',
        'GtDescription',
        'GtTag',
        'GtSiteIdLookup/Title',
        'GtSiteIdLookup/GtSiteId'
      )
      .expand('GtSiteIdLookup', 'GtTimelineTypeLookup')
      .getAll()

    return timelineItems
      .map((item) => {
        const type = item.GtTimelineTypeLookup?.Title
        const config = _.find(timelineConfig, (col) => col.title === type)
        if (item.GtSiteIdLookup?.Title && config?.showElementPortfolio) {
          return new TimelineContentModel(
            item.GtSiteIdLookup?.GtSiteId,
            item.GtSiteIdLookup?.Title,
            item.Title,
            type,
            item.GtStartDate,
            item.GtEndDate,
            item.GtDescription,
            item.GtTag,
            item.GtBudgetTotal,
            item.GtCostsTotal
          ).setConfig(config)
        }
      })
      .filter(Boolean)
  }

  /**
   * Fetches configuration data for the Project Timeline
   */
  public async fetchTimelineConfiguration() {
    const timelineConfig = await sp.web.lists
      .getByTitle(strings.TimelineConfigurationListName)
      .items.select(...new SPTimelineConfigurationItem().fields)
      .getAll()

    return timelineConfig.map((item) => new TimelineConfigurationModel(item)).filter(Boolean)
  }

  /**
   * Fetches configuration data for the Projecttimeline
   *
   * @param configItemTitle Configuration item title
   * @param dataSourceName Data source name
   * @param timelineConfig Timeline configuration
   */
  public async fetchTimelineAggregatedContent(
    configItemTitle: string,
    dataSourceName: string,
    timelineConfig: TimelineConfigurationModel[]
  ) {
    const config = _.find(
      timelineConfig,
      (col) => col.title === (configItemTitle || 'Prosjektleveranse')
    )
    if (config?.showElementPortfolio) {
      const [projectDeliveries] = await Promise.all([
        this.configure().then(async (adapter) => {
          try {
            const deliveries = await adapter.fetchItemsWithSource(
              dataSourceName || 'Alle prosjektleveranser',
              [
                'Title',
                'GtDeliveryDescriptionOWSMTXT',
                'GtDeliveryStartTimeOWSDATE',
                'GtDeliveryEndTimeOWSDATE'
              ]
            )
            return deliveries.filter(
              (delivery) => delivery.GtDeliveryStartTimeOWSDATE && delivery.GtDeliveryEndTimeOWSDATE
            )
          } catch (error) {
            throw error
          }
        })
      ])

      return projectDeliveries
        .map((item) =>
          new TimelineContentModel(
            item.SiteId,
            item.SiteTitle,
            item.Title,
            config?.title ?? configItemTitle,
            item.GtDeliveryStartTimeOWSDATE,
            item.GtDeliveryEndTimeOWSDATE,
            item.GtDeliveryDescriptionOWSMTXT
          ).setConfig(config)
        )
        .filter((t) => t)
    } else return []
  }

  /**
   * Fetch project sites
   *
   * @param rowLimit Row limit
   * @param sortProperty Sort property
   * @param sortDirection Sort direction
   */
  public async fetchProjectSites(
    rowLimit: number,
    sortProperty: string,
    sortDirection: SortDirection
  ): Promise<SearchResult[]> {
    const response = await sp.search({
      Querytext: `DepartmentId:{${this.context.pageContext.legacyPageContext.hubSiteId}} contentclass:STS_Site`,
      TrimDuplicates: false,
      RowLimit: rowLimit,
      SelectProperties: ['Title', 'Path', 'SiteId', 'Created'],
      SortList: [
        {
          Property: sortProperty,
          Direction: sortDirection
        }
      ],
      Properties: [
        {
          Name: 'EnableDynamicGroups',
          Value: {
            BoolVal: true,
            QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
          }
        }
      ]
    })
    return response.PrimarySearchResults.filter(
      (site) => this.context.pageContext.legacyPageContext.hubSiteId !== site['SiteId']
    )
  }

  /**
   * Mapping projects combing `items`, `groups`, `sites` and `users`.
   *
   * @param items Items from projects list
   * @param groups Groups from Microsoft Graph API
   * @param sites Sites search results
   * @param users Site users
   */
  private _mapProjects(
    items: ISPProjectItem[],
    groups: IGraphGroup[],
    sites: SearchResult[],
    users: ISPUser[]
  ): ProjectListModel[] {
    const projects = items
      .map((item) => {
        const [owner] = users.filter((user) => user.Id === item.GtProjectOwnerId)
        const [manager] = users.filter((user) => user.Id === item.GtProjectManagerId)
        const group = find(groups, (grp) => grp.id === item.GtGroupId)
        const model = new ProjectListModel(group?.displayName ?? item.Title, item)
        model.isUserMember = !!group
        model.hasUserAccess = any(sites, (site) => site['SiteId'] === item.GtSiteId)
        if (manager) model.manager = { text: manager.Title, imageUrl: getUserPhoto(manager.Email) }
        if (owner) model.owner = { text: owner.Title, imageUrl: getUserPhoto(owner.Email) }
        return model
      })
      .filter((p) => p)
    return projects
  }

  /**
   * Fetching enriched projects by combining list items from projects list,
   * Graph Groups and site users. The result are cached in `localStorage`
   * by the key `pp365_fetchenrichedprojects` for 30 minutes.
   *
   * @param filter Filter for project items
   * @param storageKey Storage key for `PnPClientStore`
   */
  public async fetchEnrichedProjects(
    // eslint-disable-next-line quotes
    filter = "GtProjectLifecycleStatus ne 'Avsluttet'",
    storageKey = 'pp365_fetchenrichedprojects'
  ): Promise<ProjectListModel[]> {
    await msGraph.Init(this.context.msGraphClientFactory)
    const sessionStore = new PnPClientStorage().local
    const [items, groups, users, sites] = await sessionStore.getOrPut(
      storageKey,
      async () => {
        return await Promise.all([
          sp.web.lists
            .getByTitle(strings.ProjectsListName)
            .items.select(
              'GtGroupId',
              'GtSiteId',
              'GtSiteUrl',
              'GtProjectOwnerId',
              'GtProjectManagerId',
              'GtProjectPhaseText',
              'GtStartDate',
              'GtEndDate',
              'Title',
              'GtIsParentProject',
              'GtIsProgram'
            )
            .filter(filter)
            .orderBy('Title')
            .top(500)
            .usingCaching()
            .get<ISPProjectItem[]>(),
          msGraph.Get<IGraphGroup[]>(
            '/me/memberOf/$/microsoft.graph.group',
            ['id', 'displayName'],
            // eslint-disable-next-line quotes
            "groupTypes/any(a:a%20eq%20'unified')"
          ),
          sp.web.siteUsers.select('Id', 'Title', 'Email').get<ISPUser[]>(),
          this._fetchItems(
            `DepartmentId:${this.context.pageContext.site.id.toString()} contentclass:STS_Site`,
            ['Title', 'SiteId']
          )
        ])
      },
      dateAdd(new Date(), 'minute', 30)
    )
    const projects = this._mapProjects(items, groups, sites, users)
    return projects
  }

  /**
   * Fetch projects
   *
   * @param configuration Configuration
   * @param dataSource Data source
   */
  public async fetchProjects(
    configuration?: IAggregatedListConfiguration,
    dataSource?: string
  ): Promise<any[]> {
    const { odataQuery } = (configuration?.views || []).find((v) => v.title === dataSource)
    let projects: any[]
    if (odataQuery && !dataSource.includes('(Prosjektnivå)')) {
      projects = await sp.web.lists
        .getByTitle(strings.ProjectsListName)
        .items.filter(`${odataQuery}`)
        .get<any[]>()
    }
    return projects
  }

  /**
   * Checks if the current is in the specified group
   *
   * @param groupName Group name
   */
  public async isUserInGroup(groupName: string): Promise<boolean> {
    try {
      const [siteGroup] = await sp.web.siteGroups
        .select('CanCurrentUserViewMembership', 'Title')
        .filter(`Title eq '${groupName}'`)
        .get()
      return siteGroup && siteGroup.CanCurrentUserViewMembership
    } catch (error) {
      return false
    }
  }

  /**
   * Fetch items with `sp.search` using the specified `queryTemplate` and `selectProperties`.
   *
   * @param queryTemplate Query template
   * @param selectProperties Select properties
   */
  private async _fetchItems(queryTemplate: string, selectProperties: string[]) {
    const response = await sp.search({
      QueryTemplate: `${queryTemplate}`,
      Querytext: '*',
      RowLimit: 500,
      TrimDuplicates: false,
      SelectProperties: [...selectProperties, 'Path', 'SPWebURL', 'SiteTitle']
    })
    return response.PrimarySearchResults
  }

  /**
   * Fetch items with data source
   *
   * @param dataSource Data source
   * @param selectProperties Select properties
   */
  public async fetchBenefitItemsWithSource(
    dataSource: DataSource,
    selectProperties: string[]
  ): Promise<any> {
    const results: any[] = await this._fetchItems(dataSource.searchQuery, [
      ...DEFAULT_GAINS_PROPERTIES,
      ...selectProperties
    ])

    const benefits = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_BENEFITS) === 0)
      .map((res) => new Benefit(res))

    const measurements = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_MEASUREMENTS) === 0)
      .map((res) => new BenefitMeasurement(res))
      .sort((a, b) => b.Date.getTime() - a.Date.getTime())

    const indicactors = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_INDICATORS) === 0)
      .map((res) => {
        const indicator = new BenefitMeasurementIndicator(res)
          .setMeasurements(measurements)
          .setBenefit(benefits)
        return indicator
      })
      .filter((i) => i.Benefit)

    const items = indicactors.map((i) => {
      const benefit = i.Benefit
      const measurements = i.Measurements
      const firstMeasurement = first(i.Measurements)

      const item = {
        ..._.pick(firstMeasurement?.Properties, _.identity),
        ..._.pick(benefit.Properties, _.identity),
        Title: benefit.Title,
        GtGainsResponsible: benefit.Responsible,
        GtGainsOwner: benefit.Owner,
        MeasurementIndicator: i.Title,
        GtMeasurementUnitOWSCHCS: i.Unit,
        GtStartValueOWSNMBR: i.StartValue,
        GtDesiredValueOWSNMBR: i.DesiredValue,
        LastMeasurementValue: firstMeasurement?.Value,
        MeasurementAchievement: JSON.stringify({
          Achievement: firstMeasurement?.Achievement,
          AchievementDisplay: firstMeasurement?.AchievementDisplay,
          TrendIconProps: firstMeasurement?.TrendIconProps
        }),
        Measurements: JSON.stringify(
          measurements?.map((m) => {
            return {
              Title: i.Title,
              Value: m.Value,
              ValueDisplay: m.ValueDisplay,
              Comment: m.Comment,
              Achievement: m.Achievement,
              AchievementDisplay: m.AchievementDisplay,
              DateDisplay: m.DateDisplay,
              TrendIconProps: m.TrendIconProps
            }
          })
        )
      }
      return item
    })

    return items
  }

  /**
   * Fetch items with data source name
   *
   * @param dataSourceName Data source name
   * @param selectProperties Select properties
   */
  public async fetchItemsWithSource(
    dataSourceName: string,
    selectProperties: string[]
  ): Promise<any[]> {
    let items: any[]

    try {
      const dataSrc = await this.dataSourceService.getByName(dataSourceName)
      if (!dataSrc) {
        throw new Error(format(strings.DataSourceNotFound, dataSourceName))
      }
      const dataSrcProperties = dataSrc.projectColumns.map((col) => col.fieldName) || []
      if (dataSrc.category === 'Gevinstoversikt') {
        items = await this.fetchBenefitItemsWithSource(dataSrc, [
          ...selectProperties,
          ...dataSrcProperties
        ])
      } else {
        items = await this._fetchItems(dataSrc.searchQuery, [
          ...selectProperties,
          ...dataSrcProperties
        ])
      }

      return items
    } catch (error) {
      throw new Error(format(strings.DataSourceError, dataSourceName))
    }
  }

  /**
   * Fetch data sources by category
   *
   * @param category Data source category
   */
  public async fetchDataSources(category: string): Promise<DataSource[]> {
    try {
      return await this.dataSourceService.getByCategory(category)
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, category))
    }
  }

  /**
   * Fetch items from the ContentColumns
   *
   * @param dataSourceCategory Data source category
   */
  public async fetchProjectContentColumns(dataSourceCategory: string): Promise<any> {
    try {
      if (
        isNull(dataSourceCategory) ||
        !dataSourceCategory ||
        dataSourceCategory === '' ||
        dataSourceCategory.includes('(Prosjektnivå)')
      ) {
        return []
      } else {
        const list = sp.web.lists.getByTitle(strings.ProjectContentColumnsListName)
        const items = await list.items.get()
        const filteredItems = items
          .filter(
            (item) => item.GtDataSourceCategory === dataSourceCategory || !item.GtDataSourceCategory
          )
          .map((item) => {
            const projectColumn = new ProjectColumn(item)
            projectColumn['data'] = {
              renderAs: projectColumn.dataType ? projectColumn.dataType.toLowerCase() : 'text'
            }
            return projectColumn
          })
        return filteredItems
      }
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, dataSourceCategory))
    }
  }

  /**
   * Update project content column
   *
   * @param properties Properties
   */
  public async updateProjectContentColumn(properties: TypedHash<any>): Promise<any> {
    try {
      const list = sp.web.lists.getByTitle(strings.ProjectContentColumnsListName)
      const items = await list.items.get()
      const item = items.find((i) => i.GtManagedProperty === properties.fieldName)

      if (!item) {
        throw new Error(format(strings.ProjectContentColumnItemNotFound, properties.fieldName))
      }

      const renderAs =
        properties.data.renderAs.charAt(0).toUpperCase() + properties.data.renderAs.slice(1)

      const itemUpdateResult = await list.items.getById(item.Id).update({
        GtFieldDataType: renderAs,
        GtColMinWidth: properties.minWidth
      })
      return itemUpdateResult
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * Delete project content column
   *
   * @param column Column to delete
   */
  public async deleteProjectContentColumn(column: TypedHash<any>): Promise<any> {
    try {
      const list = sp.web.lists.getByTitle(strings.ProjectContentColumnsListName)
      const items = await list.items.get()
      const item = items.find((i) => i.GtManagedProperty === column.fieldName)

      if (!item) {
        throw new Error(format(strings.ProjectContentColumnItemNotFound, column.fieldName))
      }

      const itemDeleteResult = list.items.getById(item.Id).delete()
      return itemDeleteResult
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * Add item to a list
   *
   * @param listName List name
   * @param properties Properties
   */
  public async addItemToList(listName: string, properties: TypedHash<any>): Promise<any> {
    try {
      const list = sp.web.lists.getByTitle(listName)
      const itemAddResult = await list.items.add(properties)
      return itemAddResult.data
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * Update datasource item
   *
   * @param properties Properties
   * @param dataSourceTitle Data source title
   */
  public async updateDataSourceItem(
    properties: TypedHash<any>,
    dataSourceTitle: string,
    shouldReplace: boolean = false
  ): Promise<ItemUpdateResult> {
    try {
      const list = sp.web.lists.getByTitle(strings.DataSourceListName)
      const items = await list.items.get()
      const item = items.find((i) => i.Title === dataSourceTitle)

      if (!item) {
        throw new Error(format(strings.DataSourceItemNotFound, dataSourceTitle))
      }

      if (item.GtProjectContentColumnsId && !shouldReplace) {
        properties.GtProjectContentColumnsId = {
          results: [...item.GtProjectContentColumnsId, properties.GtProjectContentColumnsId]
        }

        const itemUpdateResult = await list.items.getById(item.Id).update(properties)
        return itemUpdateResult
      } else {
        properties.GtProjectContentColumnsId = {
          results: properties.GtProjectContentColumnsId
        }

        const itemUpdateResult = await list.items.getById(item.Id).update(properties)
        return itemUpdateResult
      }
    } catch (error) {
      throw new Error(error)
    }
  }
}
