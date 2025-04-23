/* eslint-disable no-console */

import { IPersonaProps, IPersonaSharedProps } from '@fluentui/react'
import { format } from '@fluentui/react/lib/Utilities'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { dateAdd, PnPClientStorage } from '@pnp/core'
import { LogLevel } from '@pnp/logging'
import { IItem } from '@pnp/sp/items/types'
import {
  ISearchResult,
  PermissionKind,
  QueryPropertyValueType,
  SearchQueryInit,
  SortDirection,
  SPFI,
  Web
} from '@pnp/sp/presets/all'
import * as cleanDeep from 'clean-deep'
import { Idea } from 'components/IdeaModule'
import { IProvisionRequestItem } from 'interfaces/IProvisionRequestItem'
import msGraph from 'msgraph-helper'
import strings from 'PortfolioWebPartsStrings'
import {
  DataSource,
  DataSourceService,
  DefaultCaching,
  getClassProperties,
  getUserPhoto,
  IGraphGroup,
  IPortalDataServiceConfiguration,
  ItemFieldValues,
  PortalDataService,
  PortfolioOverviewView,
  ProjectContentColumn,
  ProjectListModel,
  SPContentType,
  SPField,
  SPFxContext,
  SPProjectItem,
  SPTimelineConfigurationItem,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library'
import resx from 'ResxStrings'
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
  IdeaConfigurationModel,
  ProgramItem,
  SPChartConfigurationItem,
  SPIdeaConfigurationItem
} from '../models'
import * as config from './config'
import {
  GetPortfolioConfigError,
  IFetchDataForViewItemResult,
  IPortfolioViewData,
  IPortfolioWebPartsDataAdapter,
  IProjectsData,
  PortfolioInstance
} from './types'

/**
 * Data adapter for Portfolio Web Parts.
 */
export class DataAdapter implements IPortfolioWebPartsDataAdapter {
  public portalDataService: PortalDataService
  public dataSourceService: DataSourceService
  public sp: SPFI = this._sp

  /**
   * Constructs the `DataAdapter` class
   *
   * @param _spfxContext SPFx context
   * @param _sp SPFI instance
   */
  constructor(private _spfxContext: SPFxContext, private _sp: SPFI) {
    this.portalDataService = new PortalDataService()
  }

  /**
   * Configuring the `DataAdapter` enabling use of the `DataSourceService` and `PortalDataService`
   *
   * The `dataSourceService` is dependent on the `portalDataService` being configured, as it needs
   * `portalDataService.web` to be passed as a parameter to its constructor.
   *
   * @param _spfxContext SPFx context (not used)
   * @param _configuration Configuration (not used)
   * @param portfolio Optionally the portfolio instance to configure the data adapter for
   */
  public async configure(
    _spfxContext?: WebPartContext,
    _configuration?: any,
    portfolio?: PortfolioInstance
  ): Promise<DataAdapter> {
    await msGraph.Init(this._spfxContext.msGraphClientFactory)
    if (this.dataSourceService && this.portalDataService.isConfigured) return this
    const configuration: IPortalDataServiceConfiguration = {
      spfxContext: this._spfxContext,
      url: portfolio?.url,
      activeLogLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    }
    if (portfolio) {
      configuration.listNames = {
        PROJECT_COLUMNS: portfolio.columnsListName,
        PROJECT_COLUMN_CONFIGURATION: portfolio.columnConfigListName,
        PORTFOLIO_VIEWS: portfolio.viewsListName
      }
    }
    this.portalDataService = await this.portalDataService.configure(configuration)
    this.dataSourceService = new DataSourceService(this.portalDataService.web)
    return this
  }

  public async fetchChartData(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    chartConfigurationListName: string,
    siteId: string
  ) {
    const chartConfigurationList = this._sp.web.lists.getByTitle(chartConfigurationListName)
    try {
      const [chartItems, contentTypes] = await Promise.all([
        chartConfigurationList.items.select(...Object.keys(new SPChartConfigurationItem()))<
          SPChartConfigurationItem[]
        >(),
        chartConfigurationList.contentTypes.select(...Object.keys(new SPContentType()))<
          SPContentType[]
        >()
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
    try {
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
      const refiners = columns.filter((col) => col.isRefinable)
      return {
        web: this.portalDataService.web,
        columns: columns.map((col) => col.configure(columnConfig)),
        views: views.map((view) => view.configure(columns)),
        refiners,
        programs,
        viewsUrls,
        columnUrls,
        userCanAddViews,
        hubSiteId: this.portalDataService.hubSiteId
      } as IPortfolioOverviewConfiguration
    } catch (error) {
      throw GetPortfolioConfigError(error)
    }
  }

  public async getAggregatedListConfig(
    category: string,
    level?: string
  ): Promise<IPortfolioAggregationConfiguration> {
    try {
      let calculatedLevel = resx.Lists_DataSources_Level_Portfolio

      if (this.portalDataService.url !== this._spfxContext.pageContext.web.absoluteUrl) {
        calculatedLevel = resx.Lists_DataSources_Level_Project
      }

      level = level ?? calculatedLevel

      const columns: ProjectContentColumn[] = await new Promise((resolve, reject) => {
        this.portalDataService
          .fetchProjectContentColumns('PROJECT_CONTENT_COLUMNS', category, level)
          .then(resolve)
          .catch(reject)
      })

      const [views, viewsUrls, columnUrls, levels] = await Promise.all([
        this.fetchDataSources(category, level, columns),
        this.portalDataService.getListFormUrls('DATA_SOURCES'),
        this.portalDataService.getListFormUrls('PROJECT_CONTENT_COLUMNS'),
        this.portalDataService.web.fields
          .getByInternalNameOrTitle('GtDataSourceLevel')
          .select('Choices')()
      ])

      return {
        columns,
        views,
        viewsUrls,
        columnUrls,
        level,
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
          Path: site?.Path,
          SPWebUrl: site?.SPWebUrl,
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
          Path: site?.Path,
          SPWebUrl: site?.SPWebUrl,
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
          this._sp.search({
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
      const { PrimarySearchResults, RawSearchResults } = await this._sp.search({
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
        'SPWebUrl',
        'Title',
        'SiteId'
      ]),
      this._fetchItems(
        `DepartmentId:{${siteId}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:Publisert`,
        [...configuration.columns.map((f) => f.fieldName), siteIdProperty, 'ListItemId'],
        500,
        { Refiners: configuration.refiners.map((ref) => ref.fieldName).join(',') }
      )
    ])
    projects = projects.map((item) => cleanDeep({ ...item }))
    sites = sites.map((item) => cleanDeep({ ...item }))
    statusReports = statusReports
      .sort((a, b) => b['ListItemId'] - a['ListItemId'])
      .map((item) => cleanDeep({ ...item }))
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
      const configuration = await this.getPortfolioConfig()

      const { projects, statusReports } = await this._fetchDataForView(
        configuration.views[0],
        configuration,
        this._spfxContext.pageContext.legacyPageContext.hubSiteId,
        'GtSiteIdOWSTEXT'
      )

      const data = projects.map((item) => {
        const properties = _.reduce(
          item,
          (acc, value, key) => {
            const column = _.find(configuration.refiners, { fieldName: key })
            if (column) {
              acc[column.internalName] = value
            }
            return acc
          },
          []
        )

        return {
          siteId: item?.['GtSiteIdOWSTEXT'],
          properties
        }
      })

      const reports = statusReports
        .map((report) => ({
          siteId: report?.['GtSiteIdOWSTEXT'],
          costsTotal: report?.['GtCostsTotalOWSCURR'],
          budgetTotal: report?.['GtBudgetTotalOWSCURR']
        }))
        .filter(Boolean)

      const configElement = _.find(timelineConfig, { title: strings.ProjectLabel })

      return { data, reports, configElement, columns: configuration.refiners }
    } catch (error) { }
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
    const timelineItems = await this._sp.web.lists
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
    const timelineConfig = await this._sp.web.lists
      .getByTitle(strings.TimelineConfigurationListName)
      .items.select(...new SPTimelineConfigurationItem().fields)()
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
    sortProperty: 'Created' | 'Title',
    sortDirection: SortDirection
  ): Promise<ISearchResult[]> {
    const hubSiteId = this._spfxContext.pageContext.legacyPageContext.hubSiteId
    const { PrimarySearchResults } = await this._sp.search({
      Querytext: `DepartmentId:{${hubSiteId}} contentclass:STS_Site`,
      TrimDuplicates: false,
      RowLimit: rowLimit,
      SelectProperties: ['Title', 'Path', 'SPWebUrl', 'SiteId', 'Created'],
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
    return PrimarySearchResults.filter((site) => hubSiteId !== site['SiteId'])
  }

  /**
   * Combine the result data (items, sites, users, groups) to a list of `ProjectListModel`.@
   *
   * @param param0 Deconstructed object containing the result data
   */
  private _combineResultData({
    items,
    sites,
    memberOfGroups,
    users
  }: IProjectsData): ProjectListModel[] {
    return items
      .map((item) => {
        const [owner] = users.filter((user) => user.Id === item.GtProjectOwnerId)
        const [manager] = users.filter((user) => user.Id === item.GtProjectManagerId)
        const group = _.find(memberOfGroups, (grp) => grp.id === item.GtGroupId)
        const model = new ProjectListModel(group?.displayName ?? item.Title, item)
        model.isUserMember = !!group
        model.hasUserAccess = _.any(sites, (site) => site['SiteId'] === item.GtSiteId)
        if (manager)
          model.manager = { name: manager.Title, image: { src: getUserPhoto(manager.Email) } }
        if (owner) model.owner = { name: owner.Title, image: { src: getUserPhoto(owner.Email) } }
        return model
      })
      .filter(Boolean)
  }

  public async fetchEnrichedProjects(): Promise<ProjectListModel[]> {
    const localStore = new PnPClientStorage().local
    const siteId = this._spfxContext.pageContext.site.id.toString()
    const list = this._sp.web.lists.getByTitle(resx.Lists_Projects_Title)
    const [items, sites, memberOfGroups, users] = await localStore.getOrPut(
      `pp365_fetchenrichedprojects_${siteId}`,
      async () =>
        await Promise.all([
          list.items.select(...Object.keys(new SPProjectItem())).getAll<SPProjectItem>(),
          this._fetchItems(`DepartmentId:${siteId} contentclass:STS_Site`, ['Title', 'SiteId']),
          this.fetchMemberGroups(),
          this._sp.web.siteUsers.select('Id', 'Title', 'Email')()
        ]),
      dateAdd(new Date(), 'minute', 30)
    )
    const result: IProjectsData = {
      items,
      sites,
      memberOfGroups,
      users
    }
    let projects = this._combineResultData(result)
    projects = projects.filter(
      (m) => m.lifecycleStatus !== 'Avsluttet' && m.lifecycleStatus !== 'Stengt'
    )
    projects = projects.sort((a, b) => a.title.localeCompare(b.title))
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
      projects = await this._sp.web.lists
        .getByTitle(strings.ProjectsListName)
        .items.filter(`${odataQuery}`)<any[]>()
    }
    return projects
  }

  /**
   * Checks if the current user is in the specified SharePoint group.
   *
   * @param groupName Group name
   */
  public async isUserInGroup(groupName: string): Promise<boolean> {
    try {
      const [siteGroup] = await this._sp.web.siteGroups
        .select('CanCurrentUserViewMembership', 'Title')
        .filter(`Title eq '${groupName}'`)()
      return siteGroup && siteGroup['CanCurrentUserViewMembership']
    } catch (error) {
      return false
    }
  }

  /**
   * Fetch items with `this._sp.search` using the specified `{queryTemplate}` and `{selectProperties}`.
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
  ): Promise<ISearchResult[]> {
    const query: SearchQueryInit = {
      QueryTemplate: `${queryTemplate}`,
      Querytext: '*',
      RowLimit: batchSize,
      TrimDuplicates: false,
      SelectProperties: [...selectProperties, 'Path', 'SPWebURL', 'SiteTitle', 'UniqueID'],
      ...additionalQuery
    }
    const { PrimarySearchResults, TotalRows } = await this._sp.search(query)
    const results = [...PrimarySearchResults]
    while (results.length < TotalRows) {
      const response = await this._sp.search({ ...query, StartRow: results.length })
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
      const dataSrcProperties = dataSrc.columns.map((col) => col.fieldName) || []
      if (dataSrc.category.startsWith(resx.Lists_DataSources_Category_BenefitOverview)) {
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
      throw new Error(`${format(strings.DataSourceError, dataSourceName)}  ${error}`)
    }
  }

  public async fetchDataSources(
    category: string,
    level?: string,
    columns?: ProjectContentColumn[]
  ): Promise<DataSource[]> {
    try {
      return await this.dataSourceService.getByCategory(category, level, columns)
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, category))
    }
  }

  public async clientPeoplePickerSearchUser(
    queryString: string,
    selectedItems: any[],
    maximumEntitySuggestions = 50
  ): Promise<IPersonaSharedProps[]> {
    const profiles = await this._sp.profiles.clientPeoplePickerSearchUser({
      QueryString: queryString,
      MaximumEntitySuggestions: maximumEntitySuggestions,
      AllowEmailAddresses: true,
      PrincipalSource: 15,
      PrincipalType: 1
    })
    const items = profiles.map((profile) => ({
      text: profile.DisplayText,
      secondaryText: profile.EntityData.Email,
      tertiaryText: profile.EntityData.Title,
      optionalText: profile.EntityData.Department,
      imageUrl: `/_layouts/15/userphoto.aspx?AccountName=${profile.EntityData.Email}&size=L`,
      id: profile.Key
    }))
    return items.filter(({ secondaryText }) => !_.findWhere(selectedItems, { secondaryText }))
  }

  public async getProvisionRequestSettings(provisionUrl: string): Promise<any[]> {
    try {
      const provisionSite = Web([this._sp.web, provisionUrl])
      const settingsList = provisionSite.lists.getByTitle('Provisioning Request Settings')
      const spItems = await settingsList.items
        .select(
          'Id',
          'Title',
          'Description',
          'Value',
          'PrefixText',
          'PrefixUseAttribute',
          'PrefixAttribute',
          'SuffixText',
          'SuffixUseAttribute',
          'SuffixAttribute',
          'ExternalSharingSetting'
        )
        .using(DefaultCaching)()

      return spItems.map((item) => {
        let value = item.Value === 'true' ? true : item.Value === 'false' ? false : item.Value
        if (item.Title === 'NamingConvention') {
          value = {
            value: item.Value,
            prefixText: item.PrefixText || '',
            prefixUseAttribute: item.PrefixUseAttribute,
            prefixAttribute: item.PrefixAttribute,
            suffixText: item.SuffixText || '',
            suffixUseAttribute: item.SuffixUseAttribute,
            suffixAttribute: item.SuffixAttribute
          }
        } else if (item.Title === 'DefaultExternalSharingSetting') {
          value = {
            value: item.Value,
            externalSharingSetting: item.ExternalSharingSetting
          }
        }

        return {
          title: item.Title,
          value,
          description: item.Description
        }
      })
    } catch (error) {
      return []
    }
  }

  public async getProvisionTypes(provisionUrl: string): Promise<Record<string, any>> {
    try {
      const provisionSite = Web([this._sp.web, provisionUrl])
      const typesList = provisionSite.lists.getByTitle('Provisioning Types')
      const spItems = await typesList.items
        .select(
          'Id',
          'Title',
          'SortOrder',
          'Description',
          'Allowed',
          'Image',
          'InternalTitle',
          'PrefixText',
          'PrefixUseAttribute',
          'PrefixAttribute',
          'SuffixText',
          'SuffixUseAttribute',
          'SuffixAttribute',
          'VisibleTo/EMail',
          'DefaultVisibility',
          'DefaultConfidentialData'
        )
        .expand('VisibleTo')
        .using(DefaultCaching)()
      return spItems
        .filter((item) => item.Allowed)
        .sort((a, b) => (a.SortOrder > b.SortOrder ? 1 : -1))
        .map((item) => {
          return {
            order: item.SortOrder,
            title: item.Title,
            description: item.Description,
            image: item.Image,
            type: item.InternalTitle,
            namingConvention: {
              prefixText: item.PrefixText || '',
              prefixUseAttribute: item.PrefixUseAttribute,
              prefixAttribute: item.PrefixAttribute,
              suffixText: item.SuffixText || '',
              suffixUseAttribute: item.SuffixUseAttribute,
              suffixAttribute: item.SuffixAttribute
            },
            visibleTo: item.VisibleTo,
            defaultVisibility: item.DefaultVisibility,
            defaultConfidentialData: item.DefaultConfidentialData
          }
        })
    } catch (error) {
      return []
    }
  }

  public async getProvisionUsers(
    users: any[],
    provisionUrl: string
  ): Promise<Promise<number | null>[]> {
    try {
      const provisionSite = Web([this._sp.web, provisionUrl])
      return users.map(
        async (val: IPersonaProps) => (await provisionSite.ensureUser(val.secondaryText)).data.Id
      )
    } catch {
      return null
    }
  }

  public async addProvisionRequests(
    properties: IProvisionRequestItem,
    provisionUrl: string
  ): Promise<boolean> {
    try {
      const provisionSite = Web([this._sp.web, provisionUrl])
      const provisionRequestsList = provisionSite.lists.getByTitle('Provisioning Requests')
      await provisionRequestsList.items.add(properties)
      return true
    } catch (error) {
      return false
    }
  }

  public async deleteProvisionRequest(requestId: number, provisionUrl: string): Promise<boolean> {
    try {
      const provisionSite = Web([this._sp.web, provisionUrl])
      const provisionRequestsList = provisionSite.lists.getByTitle('Provisioning Requests')
      await provisionRequestsList.items.getById(requestId).delete()
      return true
    } catch (error) {
      return false
    }
  }

  public async fetchProvisionRequests(user: string, provisionUrl: string): Promise<any[]> {
    try {
      const provisionSite = Web([this._sp.web, provisionUrl])
      const provisionRequestsList = provisionSite.lists.getByTitle('Provisioning Requests')
      const spItems = await provisionRequestsList.items
        .select(
          'Id',
          'Title',
          'SpaceDisplayName',
          'SpaceType',
          'SiteURL',
          'Status',
          'Stage',
          'Comments',
          'ApprovedDate',
          'Created',
          'Author/EMail'
        )
        .expand('Author')
        .getAll()
      return spItems
        .filter((item) => item.Author?.EMail === user)
        .sort((a, b) => (a.Created > b.Created ? 1 : -1))
        .map((item) => {
          return {
            id: item.Id,
            title: item.Title,
            displayName: item.SpaceDisplayName,
            type: item.SpaceType,
            siteUrl: item.SiteURL?.Url,
            status: item.Status,
            stage: item.Stage,
            comments: item.Comments,
            approvedDate: item.ApprovedDate,
            created: item.Created,
            author: item.Author?.EMail
          }
        })
    } catch (error) {
      return []
    }
  }

  public async getTeamTemplates(provisionUrl: string): Promise<Record<string, any>> {
    try {
      const provisionSite = Web([this._sp.web, provisionUrl])
      const templatesList = provisionSite.lists.getByTitle('Teams Templates')
      const spItems = await templatesList.items
        .select('Id', 'Title', 'TemplateId', 'Description')
        .using(DefaultCaching)()
      return [
        { title: 'Standard', templateId: 'standard', description: 'Standard team mal' },
        ...spItems.map((item) => {
          return {
            title: item.Title,
            templateId: item.TemplateId,
            description: item.Description
          }
        })
      ].sort((a, b) => (a.title > b.title ? 1 : -1))
    } catch (error) {
      return []
    }
  }

  public async siteExists(siteUrl: string): Promise<boolean> {
    try {
      const exists = await this._sp.site.exists(siteUrl)
      return exists
    } catch (error) {
      return false
    }
  }

  public async getIdeaConfiguration(
    listName: string = 'Idékonfigurasjon',
    configurationName: string = 'Standard'
  ): Promise<IdeaConfigurationModel> {
    try {
      const config = await this._sp.web.lists
        .getByTitle(listName)
        .select(...new SPIdeaConfigurationItem().fields)
        .items()

      return (
        config
          .map((item) => new IdeaConfigurationModel(item))
          .find((item) => item.title === configurationName) || new IdeaConfigurationModel(config[0])
      )
    } catch (error) {
      return error
    }
  }

  public async getItemFieldValues(item: IItem, userFields: string[] = []) {
    const [fieldValuesAsText, fieldValues] = await Promise.all([
      item.fieldValuesAsText<Record<string, string>>(),
      item
        .select(
          '*',
          ...userFields.map((fieldName) => `${fieldName}/Id`),
          ...userFields.map((fieldName) => `${fieldName}/Title`),
          ...userFields.map((fieldName) => `${fieldName}/EMail`)
        )
        .expand(...userFields)<Record<string, any>>()
    ])
    return ItemFieldValues.create({ fieldValues, fieldValuesAsText })
  }

  public async getIdeasData(configuration: IdeaConfigurationModel): Promise<Idea> {
    const getListData = async (
      listName: string
    ): Promise<{ items: any[]; fieldValues: ItemFieldValues[]; fields: SPField[] }> => {
      const [listInfo] = await this._sp.web.lists.filter(`Title eq '${listName}'`).select('Id')()
      const list = this._sp.web.lists.getById(listInfo.Id)
      const items = await list.items()

      const fields = await list.fields
        .select(...getClassProperties(SPField))
        .filter(
          "substringof('Gt', InternalName) or InternalName eq 'Title' or InternalName eq 'Id'"
        )<SPField[]>()

      const userFields = fields
        .filter((fld) => fld.TypeAsString.indexOf('User') === 0)
        .map((fld) => fld.InternalName)

      const listItems = await Promise.all(
        items.map(async (item) => {
          const listItem = await list.items.getById(item.Id)
          return listItem
        })
      )

      const allFieldValues = await Promise.all(
        listItems.map(async (item) => {
          const fieldValues = await this.getItemFieldValues(item, userFields)
          return fieldValues
        })
      )

      return {
        items: items,
        fieldValues: allFieldValues,
        fields
      }
    }

    const level = resx.Lists_DataSources_Level_Portfolio

    const columns: ProjectContentColumn[] = await new Promise((resolve, reject) => {
      this.portalDataService
        .fetchProjectContentColumns('PROJECT_CONTENT_COLUMNS', resx.Lists_DataSources_Category_IdeaModule, level)
        .then(resolve)
        .catch(reject)
    })

    const registrationData = await getListData(configuration.registrationList)
    const processingData = await getListData(configuration.processingList)

    const itemsData = registrationData.items.map((registered) => {
      const processing = processingData.items.find(
        (processingItem) => processingItem.GtRegistratedIdeaId === registered.Id
      )

      return { ...registered, processing }
    })

    const fieldValues = registrationData.fieldValues.map((values) => {
      const processingFieldValues = processingData.fieldValues.find(
        (processingFieldValues) => processingFieldValues.id === values.id
      )

      return { ...values, ...processingFieldValues }
    })

    return {
      data: {
        items: itemsData,
        fieldValues: {
          registered: registrationData.fieldValues,
          processing: processingData.fieldValues
        },
        fields: {
          registered: registrationData.fields,
          processing: processingData.fields
        },
        columns
      }
    }
  }
}