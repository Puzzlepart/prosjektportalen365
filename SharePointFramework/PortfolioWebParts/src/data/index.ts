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
  SPChartConfigurationItem,
  SPContentType
} from 'models'
import MSGraph from 'msgraph-helper'
import * as strings from 'PortfolioWebPartsStrings'
import { DataSource, PortfolioOverviewView } from 'pp365-shared/lib/models'
import { PortalDataService } from 'pp365-shared/lib/services/PortalDataService'
import * as _ from 'underscore'
import { DEFAULT_SEARCH_SETTINGS } from './types'
import { IFetchDataForViewItemResult } from './IFetchDataForViewItemResult'
import { DataSourceService } from 'pp365-shared/lib/services/DataSourceService'

export class DataAdapter {
  private _portalDataService: PortalDataService
  private _dataSourceService: DataSourceService

  constructor(public context: WebPartContext) {
    this._portalDataService = new PortalDataService().configure({
      urlOrWeb: context.pageContext.web.absoluteUrl
    })
    this._dataSourceService = new DataSourceService(sp.web)
  }

  /**
   * Fetch chart data (used by [PortfolioInsights])
   *
   * @param {PortfolioOverviewView} view View configuration
   * @param {IPortfolioConfiguration} configuration PortfolioOverviewConfiguration
   * @param {string} chartConfigurationListName List name for chart configuration
   * @param {string} siteId Site ID
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
   * @param {PortfolioOverviewView} view
   * @param {IPortfolioConfiguration} configuration
   * @param {string} siteId
   * @returns {Promise<IFetchDataForViewItemResult[]>}
   * @memberof DataAdapter
   */
  public async fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    siteId: string
  ): Promise<IFetchDataForViewItemResult[]> {
    const isCurrentUserInManagerGroup = await this._isUserInGroup(strings.PortfolioManagerGroupName)
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
   * @param {PortfolioOverviewView} view View configuration
   * @param {IPortfolioConfiguration} configuration PortfolioOverviewConfiguration
   * @param {string} siteId Site ID
   * @param {string} siteIdProperty Site ID property
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
   * @param {PortfolioOverviewView} view
   * @param {IPortfolioConfiguration} configuration
   * @param {string} siteId
   * @param {string} [siteIdProperty='GtSiteIdOWSTEXT']
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
   * @param {PortfolioOverviewView} view
   * @param {IPortfolioConfiguration} configuration
   * @param {string} siteId
   * @param {string} [siteIdProperty='GtSiteIdOWSTEXT']
   */

  private async _fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    siteId: string,
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ) {
    let [
      { PrimarySearchResults: projects },
      { PrimarySearchResults: sites },
      { PrimarySearchResults: statusReports }
    ] = await Promise.all([
      sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: view.searchQuery,
        SelectProperties: [...configuration.columns.map((f) => f.fieldName), siteIdProperty]
      }),
      sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: `DepartmentId:{${siteId}} contentclass:STS_Site`,
        SelectProperties: ['Path', 'Title', 'SiteId']
      }),
      sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: `DepartmentId:{${siteId}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:Publisert`,
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
   * Fetch project sites
   *
   * @param {number} rowLimit Row limit
   * @param {string} sortProperty Sort property
   * @param {SortDirection} sortDirection Sort direction
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
   *
   * @param {ISPProjectItem[]} items Items
   * @param {IGraphGroup[]} groups Groups
   * @param {Object} photos Photos
   * @param {ISPUser[]} users Users
   */
  private _mapProjects(
    items: ISPProjectItem[],
    groups: IGraphGroup[],
    users: ISPUser[]
  ): ProjectListModel[] {
    const projects = items
      .map((item) => {
        const [group] = groups.filter((grp) => grp.id === item.GtGroupId)
        if (!group) return null
        const [owner] = users.filter((user) => user.Id === item.GtProjectOwnerId)
        const [manager] = users.filter((user) => user.Id === item.GtProjectManagerId)
        const model = new ProjectListModel(
          item.GtSiteId,
          group.id,
          group.displayName,
          item.GtSiteUrl,
          item.GtProjectPhaseText,
          manager,
          owner
        )
        return model
      })
      .filter((p) => p)
    return projects
  }

  /**
   * Fetch enriched projects
   */
  public async fetchEncrichedProjects(): Promise<ProjectListModel[]> {
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
          'GtProjectPhaseText'
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
          key: 'fetchencrichedprojects_siteusers',
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
   * @private
   *
   * @param {string} groupName
   *
   * @returns {Promise<boolean>}
   *
   * @memberof DataAdapter
   */
  private async _isUserInGroup(groupName: string): Promise<boolean> {
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
   * @param {string} queryTemplate Query template
   * @param {string[]} selectProperties Select properties
   */
  private async _fetchItems(queryTemplate: string, selectProperties: string[]) {
    const response = await sp.searchWithCaching({
      QueryTemplate: queryTemplate,
      Querytext: '*',
      RowLimit: 500,
      TrimDuplicates: false,
      SelectProperties: [...selectProperties, 'Path', 'SPWebUrl', 'SiteTitle']
    })
    return response.PrimarySearchResults
  }

  /**
   * Fetch items with data source name
   *
   * @param {string} dataSourceName Data source name
   * @param {string[]} selectProperties Select properties
   */
  public async fetchItemsWithSource(
    dataSourceName: string,
    selectProperties: string[]
  ): Promise<any> {
    try {
      const { searchQuery } = await this._dataSourceService.getByName(dataSourceName)
      const items = await this._fetchItems(searchQuery, selectProperties)
      return items
    } catch (error) {
      throw error
    }
  }

  /**
   * Fetch data sources by category
   *
   * @param {string} category Data source category
   */
  public fetchDataSources(category: string): Promise<DataSource[]> {
    try {
      return this._dataSourceService.getByCategory(category)
    } catch (error) {
      throw error
    }
  }
}
