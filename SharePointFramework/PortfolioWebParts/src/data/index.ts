import { format } from '@fluentui/react/lib/Utilities'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { dateAdd, PnPClientStorage, stringIsNullOrEmpty } from '@pnp/common'
import {
  ItemUpdateResult,
  PermissionKind,
  QueryPropertyValueType,
  SearchResult,
  SortDirection,
  sp
} from '@pnp/sp'
import { SearchQueryInit } from '@pnp/sp/src/search'
import * as cleanDeep from 'clean-deep'
import { IGraphGroup, IPortfolioConfiguration, ISPProjectItem, ISPUser } from 'interfaces'
import { IAggregatedListConfiguration } from 'interfaces/IAggregatedListConfiguration'
import { capitalize } from 'lodash'
import msGraph from 'msgraph-helper'
import * as strings from 'PortfolioWebPartsStrings'
import { getUserPhoto } from 'pp365-shared/lib/helpers/getUserPhoto'
import { DataSource, PortfolioOverviewView, ProjectColumn } from 'pp365-shared/lib/models'
import { DataSourceService } from 'pp365-shared/lib/services/DataSourceService'
import { PortalDataService } from 'pp365-shared/lib/services/PortalDataService'
import _ from 'underscore'
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
import {
  CONTENT_TYPE_ID_BENEFITS,
  CONTENT_TYPE_ID_INDICATORS,
  CONTENT_TYPE_ID_MEASUREMENTS,
  DEFAULT_GAINS_PROPERTIES,
  DEFAULT_SEARCH_SETTINGS,
  IDataAdapter,
  IFetchDataForViewItemResult
} from './types'

/**
 * Data adapter for Portfolio Web Parts. This class
 * is responsible for fetching data from SharePoint.
 */
export class DataAdapter implements IDataAdapter {
  private _portal: PortalDataService
  public dataSourceService: DataSourceService

  /**
   * Constructs the `DataAdapter` class
   *
   * @param context Web part context
   * @param siteIds Site IDs
   */
  constructor(public context: WebPartContext, private siteIds?: string[]) {
    this._portal = new PortalDataService()
  }

  /**
   * Configuring the `DataAdapter` enabling use
   * of the `DataSourceService` and `PortalDataService`
   */
  public async configure(): Promise<DataAdapter> {
    this._portal = await this._portal.configure({
      pageContext: this.context.pageContext
    })
    if (this.dataSourceService) return this
    this.dataSourceService = new DataSourceService(this._portal.web)
    return this
  }

  /**
   * Fetch chart data for a view
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

  /**
   * Get portfolio configuration from SharePoint lists.
   *
   * This includes:
   * - `columns` - Project columns
   * - `refiners` - Refinable columns
   * - `views` - Portfolio overview views
   * - `viewsUrls` - Portfolio views list form URLs
   * - `columnUrls` - Project columns list form URLs
   * - `userCanAddViews` - User can add portfolio views
   */
  public async getPortfolioConfig(): Promise<IPortfolioConfiguration> {
    // eslint-disable-next-line prefer-const
    let [columnConfig, columns, views, viewsUrls, columnUrls, userCanAddViews] = await Promise.all([
      this._portal.getProjectColumnConfig(),
      this._portal.getProjectColumns(),
      this._portal.getPortfolioOverviewViews(),
      this._portal.getListFormUrls('PORTFOLIO_VIEWS'),
      this._portal.getListFormUrls('PROJECT_COLUMNS'),
      this._portal.currentUserHasPermissionsToList('PORTFOLIO_VIEWS', PermissionKind.AddListItems)
    ])
    columns = columns.map((col) => col.configure(columnConfig))
    const refiners = columns.filter((col) => col.isRefinable)
    views = views.map((view) => view.configure(columns))
    return {
      columns,
      refiners,
      views,
      viewsUrls,
      columnUrls,
      userCanAddViews
    } as IPortfolioConfiguration
  }

  /**
   * Get aggregated list config for the given category.
   *
   * Returns `views`, `viewsUrls`, `columnUrls` and `level`. For now
   * we only support two levels: `Portefølje` and `Prosjekt`. We need
   * to also support `Program` and `Oveordnet` in the future (as part
   * of issue #1097).
   *
   * @param category Category for data source
   * @param level Level for data source
   */
  public async getAggregatedListConfig(
    category: string,
    level?: string
  ): Promise<IAggregatedListConfiguration> {
    try {
      let calculatedLevel = 'Portefølje'
      if (this._portal.url !== this.context.pageContext.web.absoluteUrl) {
        calculatedLevel = 'Prosjekt'
      }
      const [views, viewsUrls, columnUrls] = await Promise.all([
        this.fetchDataSources(category, level ?? calculatedLevel),
        this._portal.getListFormUrls('DATA_SOURCES'),
        this._portal.getListFormUrls('PROJECT_CONTENT_COLUMNS')
      ])
      return {
        views,
        viewsUrls,
        columnUrls,
        level: calculatedLevel
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Fetch data for the specified view. Uses `this.fetchDataForManagerView` or `this.fetchDataForRegularView`
   * depending on the user's group membership (needs to be member of `strings.PortfolioManagerGroupName`).
   *
   * @description Used by `PortfolioOverview` and `PortfolioInsights`
   *
   * @param view
   * @param configuration
   * @param siteId
   *
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
   * Fetch data for manager view.
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
   * Fetches data for the Projecttimeline project.
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

  /**
   * Fetches configuration data for the Project Timeline and
   * maps them to `TimelineConfigurationModel`.
   */
  public async fetchTimelineConfiguration() {
    const timelineConfig = await sp.web.lists
      .getByTitle(strings.TimelineConfigurationListName)
      .items.select(...new SPTimelineConfigurationItem().fields)
      .getAll()

    return timelineConfig.map((item) => new TimelineConfigurationModel(item)).filter(Boolean)
  }

  /**
   * Fetches configuration data for the Project Timeline and
   * maps them to `TimelineContentModel`.
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

  /**
   * Fetch project sites using search.
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

  /**
   * Fetching enriched projects by combining list items from projects list,
   * Graph Groups and site users. The result are cached in `localStorage`
   * for 30 minutes.
   *
   * @param filter Filter for project items
   */
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
            .top(500)
            .usingCaching()
            .get<ISPProjectItem[]>(),
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

  /**
   * Fetch projects from the projects list. If a data source is specified,
   * the projects are filtered using the `odataQuery` property from the
   * specified view.
   *
   * @param configuration Configuration
   * @param dataSource Data source
   */
  public async fetchProjects(
    configuration?: IAggregatedListConfiguration,
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
   */
  private async _fetchItems(
    queryTemplate: string,
    selectProperties: string[],
    batchSize = 500
  ): Promise<SearchResult[]> {
    const query: SearchQueryInit = {
      QueryTemplate: `${queryTemplate}`,
      Querytext: '*',
      RowLimit: batchSize,
      TrimDuplicates: false,
      SelectProperties: [...selectProperties, 'Path', 'SPWebURL', 'SiteTitle', 'UniqueID']
    }
    const { PrimarySearchResults, TotalRows } = await sp.search(query)
    const results = [...PrimarySearchResults]
    while (results.length < TotalRows) {
      const response = await sp.search({ ...query, StartRow: results.length })
      results.push(...response.PrimarySearchResults)
    }
    return results
  }

  /**
   * Fetch benefit items with the specified `dataSource` and `selectProperties`. The result
   * is transformed into `Benefit`, `BenefitMeasurement` and `BenefitMeasurementIndicator` objects
   * which is the main difference from `_fetchItems`.
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

  /**
   * Fetch items with data source name. If the data source is a benefit overview,
   * the items are fetched using `fetchBenefitItemsWithSource`.
   *
   * The properties 'FileExtension' and 'ServerRedirectedURL' is always added to the select properties.
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

  /**
   * Fetch data sources by category.
   *
   * @param category Category for data source
   * @param level Level for data source
   */
  public async fetchDataSources(category: string, level?: string): Promise<DataSource[]> {
    try {
      const dataSources = await this.dataSourceService.getByCategory(category, level)
      return dataSources
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, category))
    }
  }

  /**
   * Fetch items from the project content columns SharePoint list on the hub site.
   *
   * @param category Category for data source
   */
  public async fetchProjectContentColumns(dataSourceCategory: string): Promise<any> {
    try {
      if (stringIsNullOrEmpty(dataSourceCategory)) return []
      const projectContentColumnsList = this._portal.web.lists.getByTitle(
        strings.ProjectContentColumnsListName
      )
      const projectContentColumnsListItems = await projectContentColumnsList.items.get()
      const filteredItems = projectContentColumnsListItems
        .filter(
          (item) => item.GtDataSourceCategory === dataSourceCategory || !item.GtDataSourceCategory
        )
        .map((item) => {
          const projectColumn = new ProjectColumn(item)
          const renderAs = (projectColumn.dataType ? projectColumn.dataType.toLowerCase() : 'text')
            .split(' ')
            .join('_')
          projectColumn['data'] = { renderAs }
          return projectColumn
        })
      return filteredItems
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, dataSourceCategory))
    }
  }

  /**
   * Update project content column. The column is identified by the field name.
   *
   * @param column Column properties
   * @param persistRenderAs Persist render as property
   */
  public async updateProjectContentColumn(
    column: Record<string, any>,
    persistRenderAs = false
  ): Promise<any> {
    try {
      const list = sp.web.lists.getByTitle(strings.ProjectContentColumnsListName)
      const items = await list.items.get()
      const item = items.find((i) => i.GtManagedProperty === column.fieldName)

      if (!item) {
        throw new Error(format(strings.ProjectContentColumnItemNotFound, column.fieldName))
      }

      const properties: Record<string, any> = {
        GtColMinWidth: column.minWidth
      }
      if (persistRenderAs) {
        properties.GtFieldDataType = capitalize(column.data.renderAs).split('_').join(' ')
      }
      const itemUpdateResult = await list.items.getById(item.Id).update(properties)
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

  /**
   * Add item to a list
   *
   * @param listName List name
   * @param properties Properties
   */
  public async addItemToList(listName: string, properties: Record<string, any>): Promise<any> {
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
