import { format } from '@fluentui/react/lib/Utilities'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { dateAdd, PnPClientStorage, stringIsNullOrEmpty } from '@pnp/common'
import {
  ItemUpdateResult,
  ItemUpdateResultData,
  PermissionKind,
  QueryPropertyValueType,
  SearchResult,
  SortDirection,
  sp
} from '@pnp/sp'
import { SearchQueryInit } from '@pnp/sp/src/search'
import * as cleanDeep from 'clean-deep'
import msGraph from 'msgraph-helper'
import * as strings from 'PortfolioWebPartsStrings'
import {
  DataSource,
  DataSourceService,
  getUserPhoto,
  IGraphGroup,
  ISPProjectItem,
  ISPUser,
  PortalDataService,
  PortfolioOverviewView,
  ProjectContentColumn,
  ProjectListModel,
  SPContentType,
  SPProjectColumnItem,
  SPProjectContentColumnItem,
  SPTimelineConfigurationItem,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library'
import _ from 'underscore'
import { IPortfolioAggregationConfiguration } from '../components/PortfolioAggregation'
import { IPortfolioOverviewConfiguration } from '../components/PortfolioOverview/types'
import {
  Benefit,
  BenefitMeasurement,
  BenefitMeasurementIndicator,
  ChartConfiguration,
  ChartData,
  ChartDataItem,
  DataField,
  ProgramItem,
  SPChartConfigurationItem
} from '../models'
import * as config from './config'
import {
  IFetchDataForViewItemResult,
  IPortfolioViewData,
  IPortfolioWebPartsDataAdapter
} from './types'

/**
 * Data adapter for Portfolio Web Parts.
 */
export class DataAdapter implements IPortfolioWebPartsDataAdapter {
  public portalDataService: PortalDataService
  public dataSourceService: DataSourceService

  /**
   * Constructs the `DataAdapter` class
   *
   * @param context Web part context
   * @param siteIds Site IDs
   */
  constructor(public context: WebPartContext, private siteIds?: string[]) {
    this.portalDataService = new PortalDataService()
  }

  /**
   * Configuring the `DataAdapter` enabling use of the `DataSourceService` and `PortalDataService`
   *
   * The `dataSourceService` is dependent on the `portalDataService` being configured, as it needs
   * `portalDataService.web` to be passed as a parameter to its constructor.
   */
  public async configure(): Promise<DataAdapter> {
    if (this.dataSourceService && this.portalDataService.isConfigured) return this
    this.portalDataService = await this.portalDataService.configure({
      pageContext: this.context.pageContext
    })
    this.dataSourceService = new DataSourceService(this.portalDataService.web)
    return this
  }

  public async fetchChartData(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
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
      const items = (await this.fetchDataForView(view, configuration, siteId)).items.map(
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

  public async getPortfolioConfig(): Promise<IPortfolioOverviewConfiguration> {
    // eslint-disable-next-line prefer-const
    const [columnConfig, columns, views, programs, viewsUrls, columnUrls, userCanAddViews] =
      await Promise.all([
        this.portalDataService.getProjectColumnConfig(),
        this.portalDataService.getProjectColumns(),
        this.portalDataService.getPortfolioOverviewViews(),
        this.portalDataService.getPrograms(ProgramItem),
        this.portalDataService.getListFormUrls('PORTFOLIO_VIEWS'),
        this.portalDataService.getListFormUrls('PROJECT_COLUMNS'),
        this.portalDataService.currentUserHasPermissionsToList(
          'PORTFOLIO_VIEWS',
          PermissionKind.AddListItems
        )
      ])
    const configuredColumns = columns.map((col) => col.configure(columnConfig))
    const refiners = columns.filter((col) => col.isRefinable)
    const configuredViews = views.map((view) => view.configure(columns))
    return {
      columns: configuredColumns,
      refiners,
      views: configuredViews,
      programs,
      viewsUrls,
      columnUrls,
      userCanAddViews
    } as IPortfolioOverviewConfiguration
  }

  public async getAggregatedListConfig(
    category: string,
    level?: string
  ): Promise<IPortfolioAggregationConfiguration> {
    try {
      let calculatedLevel = 'Portefølje'
      if (this.portalDataService.url !== this.context.pageContext.web.absoluteUrl) {
        calculatedLevel = 'Prosjekt'
      }
      const [views, viewsUrls, columnUrls, levels] = await Promise.all([
        this.fetchDataSources(category, level ?? calculatedLevel),
        this.portalDataService.getListFormUrls('DATA_SOURCES'),
        this.portalDataService.getListFormUrls('PROJECT_CONTENT_COLUMNS'),
        this.portalDataService.web.fields
          .getByInternalNameOrTitle('GtDataSourceLevel')
          .select('Choices')
          .get()
      ])
      return {
        views,
        viewsUrls,
        columnUrls,
        level: calculatedLevel,
        levels: levels?.Choices ?? []
      } as IPortfolioAggregationConfiguration
    } catch (error) {
      return null
    }
  }

  public async fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string
  ): Promise<IPortfolioViewData> {
    const isCurrentUserInManagerGroup = await this.isUserInGroup(strings.PortfolioManagerGroupName)
    if (isCurrentUserInManagerGroup) {
      return await this.fetchDataForManagerView(view, configuration, siteId)
    } else {
      return await this.fetchDataForRegularView(view, configuration, siteId)
    }
  }

  public async fetchDataForRegularView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string,
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IPortfolioViewData> {
    try {
      const { projects, sites, statusReports, managedProperties } = await this._fetchDataForView(
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

      return { items, managedProperties } as IPortfolioViewData
    } catch (err) {
      throw err
    }
  }

  public async fetchDataForManagerView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string,
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IPortfolioViewData> {
    try {
      const { projects, sites, statusReports, managedProperties } = await this._fetchDataForView(
        view,
        configuration,
        siteId,
        siteIdProperty
      )

      const items: IFetchDataForViewItemResult[] = projects.map((project) => {
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

      return { items, managedProperties } as IPortfolioViewData
    } catch (err) {
      throw err
    }
  }

  /**
   * Fetch items for the specified view. If the `view` has specified `searchQueries` it will use
   * `Promise.all` to fetch all queries in parallel. Otherwise it will use a single query. The
   * support for `searchQueries` is added to support program views in the portfolio overview.
   *
   * @param view View configuration
   * @param selectProperties Select properties
   */
  private async _fetchItemsForView(view: PortfolioOverviewView, selectProperties: string[] = []) {
    if (_.isArray(view.searchQueries)) {
      const result = await Promise.all(
        view.searchQueries.map((query) =>
          sp.search({
            ...config.DEFAULT_SEARCH_SETTINGS,
            QueryTemplate: query,
            SelectProperties: selectProperties
          })
        )
      )
      return {
        results: _.flatten(result.map(({ PrimarySearchResults }) => PrimarySearchResults)),
        managedProperties: []
      } as const
    } else {
      const { PrimarySearchResults, RawSearchResults } = await sp.search({
        ...config.DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: view.searchQuery,
        SelectProperties: selectProperties,
        Refiners: 'managedproperties(filter=600/0/*)'
      })
      const managedProperties = _.first(
        RawSearchResults?.PrimaryQueryResult?.RefinementResults?.Refiners ?? []
      )?.Entries?.map((entry) => entry.RefinementName)
      return { results: PrimarySearchResults, managedProperties }
    }
  }

  /**
   * Internal method for fetching data for a view. Used by `this.fetchDataForRegularView`
   * and `this.fetchDataForManagerView`. Uses `this._fetchItems` to fetch data from search
   * supporting more than 500 items using batching.
   *
   * @param view View
   * @param configuration Configuration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property (defaults to **GtSiteIdOWSTEXT**)
   */
  private async _fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string,
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ) {
    // eslint-disable-next-line prefer-const
    let [{ results: projects, managedProperties }, sites, statusReports] = await Promise.all([
      this._fetchItemsForView(view, [
        ...configuration.columns.map((f) => f.fieldName),
        siteIdProperty
      ]),
      this._fetchItems(`DepartmentId:{${siteId}} contentclass:STS_Site`, [
        'Path',
        'Title',
        'SiteId'
      ]),
      this._fetchItems(
        `DepartmentId:{${siteId}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:Publisert`,
        [...configuration.columns.map((f) => f.fieldName), siteIdProperty],
        500,
        { Refiners: configuration.refiners.map((ref) => ref.fieldName).join(',') }
      )
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
      statusReports,
      managedProperties
    } as const
  }

  public async fetchTimelineProjectData(timelineConfig: TimelineConfigurationModel[]) {
    try {
      const [{ PrimarySearchResults: statusReports }] = await Promise.all([
        sp.search({
          ...config.DEFAULT_SEARCH_SETTINGS,
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
   *  Fetches items from timeline content list and maps them to `TimelineContentListModel`.
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
          ).usingConfig(config)
        }
      })
      .filter(Boolean)
  }

  public async fetchTimelineConfiguration() {
    const timelineConfig = await sp.web.lists
      .getByTitle(strings.TimelineConfigurationListName)
      .items.select(...new SPTimelineConfigurationItem().fields)
      .getAll()

    return timelineConfig.map((item) => new TimelineConfigurationModel(item)).filter(Boolean)
  }

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
      const projectDeliveries = await (async () => {
        try {
          const deliveries = await this.fetchItemsWithSource(
            dataSourceName || 'Alle prosjektleveranser',
            [
              'Title',
              'GtDeliveryDescriptionOWSMTXT',
              'GtDeliveryStartTimeOWSDATE',
              'GtDeliveryEndTimeOWSDATE',
              'GtTagOWSCHCS'
            ]
          )
          return deliveries.filter(
            (delivery) => delivery.GtDeliveryStartTimeOWSDATE && delivery.GtDeliveryEndTimeOWSDATE
          ) as any[]
        } catch (error) {
          throw error
        }
      })()

      return (projectDeliveries as any[])
        .map<TimelineContentModel>((item: any) =>
          new TimelineContentModel(
            item.SiteId,
            item.SiteTitle,
            item.Title,
            config?.title ?? configItemTitle,
            item.GtDeliveryStartTimeOWSDATE,
            item.GtDeliveryEndTimeOWSDATE,
            item.GtDeliveryDescriptionOWSMTXT,
            item.GtTagOWSCHCS
          ).usingConfig(config)
        )
        .filter(Boolean)
    } else return []
  }

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
        const group = _.find(groups, (grp) => grp.id === item.GtGroupId)
        const model = new ProjectListModel(group?.displayName ?? item.Title, item)
        model.isUserMember = !!group
        model.hasUserAccess = _.any(sites, (site) => site['SiteId'] === item.GtSiteId)
        if (manager) model.manager = { text: manager.Title, imageUrl: getUserPhoto(manager.Email) }
        if (owner) model.owner = { text: owner.Title, imageUrl: getUserPhoto(owner.Email) }
        return model
      })
      .filter(Boolean)
    return projects
  }

  public async fetchEnrichedProjects(
    // eslint-disable-next-line quotes
    filter = "GtProjectLifecycleStatus ne 'Avsluttet'"
  ): Promise<ProjectListModel[]> {
    await msGraph.Init(this.context.msGraphClientFactory)
    const localStore = new PnPClientStorage().local
    const siteId = this.context.pageContext.site.id.toString()
    const [items, groups, users, sites] = await localStore.getOrPut(
      `pp365_fetchenrichedprojects_${siteId}`,
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
            .getAll(),
          this.fetchMemberGroups(),
          sp.web.siteUsers.select('Id', 'Title', 'Email').get<ISPUser[]>(),
          this._fetchItems(`DepartmentId:${siteId} contentclass:STS_Site`, ['Title', 'SiteId'])
        ])
      },
      dateAdd(new Date(), 'minute', 30)
    )
    const projects = this._mapProjects(items, groups, sites, users)
    return projects
  }

  /**
   * Fetches groups where the user is a member from the Graph
   * using `msgraph-helper`. Resolves an empty array if the
   * request fails (see https://github.com/Puzzlepart/prosjektportalen365/issues/908).
   */
  private fetchMemberGroups() {
    return new Promise<IGraphGroup[]>((resolve) => {
      msGraph
        .Get<IGraphGroup[]>(
          '/me/memberOf/$/microsoft.graph.group',
          ['id', 'displayName'],
          // eslint-disable-next-line quotes
          "groupTypes/any(a:a%20eq%20'unified')"
        )
        .then((value) => resolve(value))
        .catch(() => resolve([]))
    })
  }

  public async fetchProjects(
    configuration?: IPortfolioAggregationConfiguration,
    dataSource?: string
  ): Promise<any[]> {
    const odataQuery = (configuration?.views || []).find((v) => v.title === dataSource)?.odataQuery
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
   * Checks if the current is in the specified SharePoint group.
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
   * Fetch items with `sp.search` using the specified `{queryTemplate}` and `{selectProperties}`.
   * Uses a `while` loop to fetch all items in batches of `{batchSize}`.
   *
   * @param queryTemplate Query template
   * @param selectProperties Select properties
   * @param batchSize Batch size (default: 500)
   * @param additionalQuery Additional query parameters
   */
  private async _fetchItems(
    queryTemplate: string,
    selectProperties: string[],
    batchSize = 500,
    additionalQuery: Record<string, any> = {}
  ): Promise<SearchResult[]> {
    const query: SearchQueryInit = {
      QueryTemplate: `${queryTemplate}`,
      Querytext: '*',
      RowLimit: batchSize,
      TrimDuplicates: false,
      SelectProperties: [...selectProperties, 'Path', 'SPWebURL', 'SiteTitle', 'UniqueID'],
      ...additionalQuery
    }
    const { PrimarySearchResults, TotalRows } = await sp.search(query)
    const results = [...PrimarySearchResults]
    while (results.length < TotalRows) {
      const response = await sp.search({ ...query, StartRow: results.length })
      results.push(...response.PrimarySearchResults)
    }
    return results
  }

  public async fetchBenefitItemsWithSource(
    dataSource: DataSource,
    selectProperties: string[]
  ): Promise<any> {
    const results: any[] = await this._fetchItems(dataSource.searchQuery, [
      ...config.DEFAULT_GAINS_PROPERTIES,
      ...selectProperties
    ])

    const benefits = results
      .filter((res) => res.ContentTypeID.indexOf(config.CONTENT_TYPE_ID_BENEFITS) === 0)
      .map((res) => new Benefit(res))

    const measurements = results
      .filter((res) => res.ContentTypeID.indexOf(config.CONTENT_TYPE_ID_MEASUREMENTS) === 0)
      .map((res) => new BenefitMeasurement(res))
      .sort((a, b) => b.Date.getTime() - a.Date.getTime())

    const indicactors = results
      .filter((res) => res.ContentTypeID.indexOf(config.CONTENT_TYPE_ID_INDICATORS) === 0)
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
      const firstMeasurement = _.first(i.Measurements)

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
      if (dataSrc.category.startsWith('Gevinstoversikt')) {
        items = await this.fetchBenefitItemsWithSource(dataSrc, [
          ...selectProperties,
          ...dataSrcProperties
        ])
      } else {
        items = await this._fetchItems(dataSrc.searchQuery, [
          ...selectProperties,
          ...dataSrcProperties,
          'FileExtension',
          'ServerRedirectedURL'
        ])
      }

      return items
    } catch (error) {
      throw new Error(format(strings.DataSourceError, dataSourceName))
    }
  }

  public async fetchDataSources(category: string, level?: string): Promise<DataSource[]> {
    try {
      const dataSources = await this.dataSourceService.getByCategory(category, level)
      return dataSources
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, category))
    }
  }

  public async fetchProjectContentColumns(
    dataSourceCategory: string
  ): Promise<ProjectContentColumn[]> {
    try {
      if (stringIsNullOrEmpty(dataSourceCategory)) return []
      const projectContentColumnsList = this.portalDataService.web.lists.getByTitle(
        strings.ProjectContentColumnsListName
      )
      const columnItems = await projectContentColumnsList.items
        .select(...Object.keys(new SPProjectContentColumnItem()))
        .usingCaching()
        .get<SPProjectContentColumnItem[]>()
      const filteredColumnItems = columnItems.filter(
        (col) => col.GtDataSourceCategory === dataSourceCategory || !col.GtDataSourceCategory
      )
      return filteredColumnItems.map((item) => {
        const col = new ProjectContentColumn(item)
        const renderAs = (col.dataType ? col.dataType.toLowerCase() : 'text').split(' ').join('_')
        return col.setData({ renderAs })
      })
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, dataSourceCategory))
    }
  }

  public async updateProjectContentColumn(
    columnItem: SPProjectContentColumnItem,
    persistRenderAs = false
  ): Promise<any> {
    try {
      const list = sp.web.lists.getByTitle(strings.ProjectContentColumnsListName)
      const properties: SPProjectContentColumnItem = _.pick(
        columnItem,
        [
          'GtColMinWidth',
          'GtColMaxWidth',
          persistRenderAs && 'GtFieldDataTypeProperties',
          persistRenderAs && 'GtFieldDataType'
        ].filter(Boolean)
      )
      return await list.items.getById(columnItem.Id).update(properties)
    } catch (error) {
      throw new Error(error)
    }
  }

  public async deleteProjectContentColumn(column: Record<string, any>): Promise<any> {
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

  public async addItemToList<T = any>(
    listName: string,
    properties: Record<string, any>
  ): Promise<T> {
    try {
      const list = sp.web.lists.getByTitle(listName)
      const itemAddResult = await list.items.add(properties)
      return itemAddResult.data as T
    } catch (error) {
      throw new Error(error)
    }
  }

  public async updateItemInList<T = ItemUpdateResultData>(
    listName: string,
    itemId: number,
    properties: Record<string, any>
  ): Promise<T> {
    try {
      const list = sp.web.lists.getByTitle(listName)
      const itemUpdateResult = await list.items.getById(itemId).update(properties)
      return itemUpdateResult.data as unknown as T
    } catch (error) {
      throw new Error(error)
    }
  }

  public async deleteItemFromList(listName: string, itemId: number): Promise<boolean> {
    try {
      const list = sp.web.lists.getByTitle(listName)
      await list.items.getById(itemId).delete()
      return true
    } catch {
      return false
    }
  }

  public async addColumnToPortfolioView(
    properties: SPProjectColumnItem,
    view: PortfolioOverviewView
  ): Promise<boolean> {
    try {
      const projectColumnsList = sp.web.lists.getByTitle(strings.ProjectColumnsListName)
      const portfolioViewsList = sp.web.lists.getByTitle(strings.PortfolioViewsListName)
      const column = await projectColumnsList.items.add(properties)
      portfolioViewsList.items.getById(view.id as any).update({
        GtPortfolioColumnsId: {
          results: [...view.columns.map((c) => c.id), column.data.Id]
        }
      })
      return true
    } catch (error) {
      return false
    }
  }

  public async updateDataSourceItem(
    properties: Record<string, any>,
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

export * from './types'
