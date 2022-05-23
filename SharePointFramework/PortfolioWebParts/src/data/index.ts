import { WebPartContext } from '@microsoft/sp-webpart-base'
import { dateAdd } from '@pnp/common'
import { QueryPropertyValueType, SearchResult, SortDirection, sp } from '@pnp/sp'
import * as cleanDeep from 'clean-deep'
import { IGraphGroup, IPortfolioConfiguration, ISPProjectItem, ISPUser } from 'interfaces'
import {
  ChartConfiguration,
  ChartData,
  ChartDataItem,
  DataField,
  ProjectListModel,
  TimelineContentListModel,
  SPChartConfigurationItem,
  SPContentType
} from 'models'
import MSGraph from 'msgraph-helper'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'PortfolioWebPartsStrings'
import { getUserPhoto } from 'pp365-shared/lib/helpers/getUserPhoto'
import { DataSource, PortfolioOverviewView } from 'pp365-shared/lib/models'
import { DataSourceService } from 'pp365-shared/lib/services/DataSourceService'
import { PortalDataService } from 'pp365-shared/lib/services/PortalDataService'
import HubSiteService from 'sp-hubsite-service'
import _ from 'underscore'
import { IFetchDataForViewItemResult } from './IFetchDataForViewItemResult'
import { DEFAULT_SEARCH_SETTINGS, IDataAdapter } from './types'

export class DataAdapter implements IDataAdapter {
  private _portalDataService: PortalDataService
  private _dataSourceService: DataSourceService
  private _siteIds: string[]

  constructor(public context: WebPartContext, private siteIds?: string[]) {
    this._portalDataService = new PortalDataService().configure({
      urlOrWeb: context.pageContext.web.absoluteUrl
    })
    this._siteIds = siteIds
  }

  /**
   * Configuring the DataAdapter enabling use
   * of the DataSourceService.
   */
  public async configure(): Promise<DataAdapter> {
    if (this._dataSourceService) return this
    const { web } = await HubSiteService.GetHubSite(sp, this.context.pageContext as any)
    this._dataSourceService = new DataSourceService(web)
    return this
  }

  /**
   * Fetch chart data (used by [PortfolioInsights])
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
   * Fetch data for view
   *
   * @description Used by PortfolioOverview and PortfolioInsights
   *
   * @param view
   * @param configuration
   * @param siteId
   * @returns {Promise<IFetchDataForViewItemResult[]>}
   * @memberof DataAdapter
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
   * @description Used by PortfolioOverview and PortfolioInsights
   *
   * @param view
   * @param configuration
   * @param siteId
   * @param [siteIdProperty='GtSiteIdOWSTEXT']
   * @returns {Promise<IFetchDataForViewItemResult[]>}
   * @memberof DataAdapter
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
   *  Fetches data for portfolio views
   * @param view
   * @param configuration
   * @param siteId
   * @param [siteIdProperty='GtSiteIdOWSTEXT']
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
        QueryTemplate: `${queryArray ?? ''
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
   * @param siteId
   */
  public async fetchDataForTimelineProject(siteId: string) {
    const siteIdProperty: string = 'GtSiteIdOWSTEXT'

    const [timelineConfig, { PrimarySearchResults: statusReports }] = await Promise.all([
      this.fetchTimelineConfiguration(),
      sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: `DepartmentId:{${this.context.pageContext.legacyPageContext.hubSiteId}} ${siteIdProperty}:{${siteId}}
        ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:Publisert`,
        SelectProperties: [siteIdProperty, 'GtCostsTotalOWSCURR', 'GtBudgetTotalOWSCURR']
      })
    ])
    const [data] = (statusReports.map((item) => cleanDeep({ ...item })))
    const config = _.find(timelineConfig, (col) => col.Title === strings.ProjectLabel)
    return {
      type: strings.ProjectLabel,
      costsTotal: data && data['GtCostsTotalOWSCURR'],
      budgetTotal: data && data['GtBudgetTotalOWSCURR'],
      sortOrder: config && config.GtSortOrder,
      hexColor: config && config.GtHexColor,
      elementType: config && config.GtElementType,
      showElementPortfolio: config && config.GtShowElementPortfolio,
      showElementProgram: config && config.GtShowElementProgram,
      timelineFilter: config && config.GtTimelineFilter,
    }
  }

  /**
   *  Fetches items from timelinecontent list
   *
   * * Fetching list items
   * * Maps the items to TimelineContentListModel
   */
  public async fetchTimelineContentItems() {
    const [timelineConfig, timelineItems] = await Promise.all([
      this.fetchTimelineConfiguration(),
      sp.web.lists
        .getByTitle(strings.TimelineContentListName)
        .items.select(
          'Title',
          'GtTimelineTypeLookup/Title',
          'GtStartDate',
          'GtEndDate',
          'GtBudgetTotal',
          'GtCostsTotal',
          'GtSiteIdLookup/Title',
          'GtSiteIdLookup/GtSiteId'
        )
        .top(500)
        .expand('GtSiteIdLookup', 'GtTimelineTypeLookup')
        .get()
    ])

    return timelineItems
      .map((item) => {
        const type = item.GtTimelineTypeLookup && item.GtTimelineTypeLookup.Title
        const config = _.find(timelineConfig, (col) => col.Title === type)

        if (item.GtSiteIdLookup?.Title && (config && config.GtShowElementPortfolio)) {
          const model = new TimelineContentListModel(
            item.GtSiteIdLookup?.GtSiteId,
            item.GtSiteIdLookup?.Title,
            item.Title,
            config && config.Title,
            config && config.GtSortOrder,
            config && config.GtHexColor,
            config && config.GtElementType,
            config && config.GtShowElementPortfolio,
            config && config.GtShowElementProgram,
            config && config.GtTimelineFilter,
            item.GtStartDate,
            item.GtEndDate,
            item.GtBudgetTotal,
            item.GtCostsTotal
          )
          return model
        }
      })
      .filter((p) => p)
  }

  /**
   * Fetches configuration data for the Projecttimeline
   *
   */
  public async fetchTimelineConfiguration() {
    return await sp.web.lists
      .getByTitle(strings.TimelineConfigurationListName)
      .items.select(
        'Title',
        'GtSortOrder',
        'GtHexColor',
        'GtElementType',
        'GtShowElementPortfolio',
        'GtShowElementProgram',
        'GtTimelineFilter',
      )
      .top(500)
      .get()
  }

  /**
   * Fetches configuration data for the Projecttimeline
   *
   */
  public async fetchTimelineAggregatedContent(configItemTitle: string, dataSourceName: string) {
    const [timelineConfig] = await Promise.all([
      this.fetchTimelineConfiguration()
    ])

    const config: any = _.find(timelineConfig, (col) => col.Title === configItemTitle)

    if (config && config.GtShowElementPortfolio) {
      const [projectDeliveries] = await Promise.all([
        this.configure().then((adapter) => {
          return adapter.fetchItemsWithSource(dataSourceName, ['Title', 'GtDeliveryDescriptionOWSMTXT', 'GtDeliveryStartTimeOWSDATE', 'GtDeliveryEndTimeOWSDATE'])
            .then((deliveries) => {
              return deliveries
            })
            .catch((error) => {
              throw error
            })
        })
      ])

      return projectDeliveries
        .map((item) => {
          const model = new TimelineContentListModel(
            item.SiteId,
            item.SiteTitle,
            item.Title,
            config && config.Title || configItemTitle,
            config && config.GtSortOrder || 90,
            config && config.GtHexColor || '#384f61',
            config && config.GtElementType || strings.BarLabel,
            config && config.GtShowElementPortfolio || false,
            config && config.GtShowElementProgram || false,
            config && config.GtTimelineFilter || true,
            item.GtDeliveryStartTimeOWSDATE,
            item.GtDeliveryEndTimeOWSDATE,
            null,
            null,
            null,
            null,
            item.GtDeliveryDescriptionOWSMTXT
          )
          return model
        })
        .filter((t) => t)
    }
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
   * Map projects
   * @param items Items
   * @param groups Groups
   * @param users Users
   */
  private _mapProjects(
    items: ISPProjectItem[],
    groups: IGraphGroup[],
    users: ISPUser[]
  ): ProjectListModel[] {
    const projects = items
      .map((item) => {
        const [group] = groups.filter((grp) => grp.id === item.GtGroupId)
        const [owner] = users.filter((user) => user.Id === item.GtProjectOwnerId)
        const [manager] = users.filter((user) => user.Id === item.GtProjectManagerId)
        const model = new ProjectListModel(group?.displayName ?? item.Title, item)
        model.userIsMember = !!group
        if (manager) model.manager = { text: manager.Title, imageUrl: getUserPhoto(manager.Email) }
        if (owner) model.owner = { text: owner.Title, imageUrl: getUserPhoto(owner.Email) }
        return model
      })
      .filter((p) => p)
    return projects
  }

  /**
   * Fetch enriched projects
   * * Fetching project list items
   * * Graph groups
   * * Site users
   * * Combines the data
   */
  public async fetchEnrichedProjects(): Promise<ProjectListModel[]> {
    await MSGraph.Init(this.context.msGraphClientFactory)
    const [items, groups, users] = await Promise.all([
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
        // eslint-disable-next-line quotes
        .filter("GtProjectLifecycleStatus ne 'Avsluttet'")
        .orderBy('Title')
        .top(500)
        .usingCaching()
        .get<ISPProjectItem[]>(),
      MSGraph.Get<IGraphGroup[]>(
        '/me/memberOf/$/microsoft.graph.group',
        ['id', 'displayName'],
        // eslint-disable-next-line quotes
        "groupTypes/any(a:a%20eq%20'unified')"
      ),
      sp.web.siteUsers
        .select('Id', 'Title', 'Email')
        .usingCaching({
          key: 'fetchenrichedprojects_siteusers',
          storeName: 'session',
          expiration: dateAdd(new Date(), 'minute', 15)
        })
        .get<ISPUser[]>()
    ])
    const projects = this._mapProjects(items, groups, users)
    return projects
  }

  /**
   * Checks if the current is in the specified group
   *
   * @public
   *
   * @param groupName
   *
   * @returns {Promise<boolean>}
   *
   * @memberof DataAdapter
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
   * Fetch items
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
   * Fetch items with data source name
   *
   * @param name Data source name
   * @param selectProperties Select properties
   */
  public async fetchItemsWithSource(name: string, selectProperties: string[]): Promise<any> {
    const dataSrc = await this._dataSourceService.getByName(name)
    if (!dataSrc) {
      throw new Error(format(strings.DataSourceNotFound, name))
    }
    try {
      const items = await this._fetchItems(dataSrc.searchQuery, selectProperties)
      return items
    } catch (error) {
      throw new Error(format(strings.DataSourceError, name))
    }
  }

  /**
   * Fetch data sources by category
   *
   * @param category Data source category
   */
  public fetchDataSources(category: string): Promise<DataSource[]> {
    try {
      return this._dataSourceService.getByCategory(category)
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, category))
    }
  }
}
