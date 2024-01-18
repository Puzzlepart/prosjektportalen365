import { WebPartContext } from '@microsoft/sp-webpart-base'
import { ISiteUserInfo } from '@pnp/sp/presets/all'
import { ISearchResult, SortDirection } from '@pnp/sp/search'
import {
  DataSource,
  DataSourceService,
  IGraphGroup,
  PortalDataService,
  PortfolioOverviewView,
  ProjectContentColumn,
  ProjectListModel,
  SPProjectColumnItem,
  SPProjectItem,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library'
import { IPortfolioAggregationConfiguration, IPortfolioOverviewConfiguration } from '../components'

export interface IFetchDataForViewItemResult extends ISearchResult {
  SiteId: string
  [key: string]: any
}

export type IPortfolioViewData = {
  items: IFetchDataForViewItemResult[]
  managedProperties?: string[]
}

/**
 * Project data fetched in `fetchEnrichedProjects` method, and
 * used as parameter in the `_combineResultData` method.
 */
export interface IProjectsData {
  items: SPProjectItem[]
  sites: ISearchResult[]
  memberOfGroups: IGraphGroup[]
  users: ISiteUserInfo[]
}

export interface IPortfolioWebPartsDataAdapter {
  /**
   * Configure data adapter - returns an configured instance of the data adapter.
   *
   * @param spfxContext SPFx context (optional)
   * @param configuration Configuration for data adapter (optional)
   */
  configure(
    spfxContext?: WebPartContext,
    configuration?: any
  ): Promise<IPortfolioWebPartsDataAdapter | void>

  /**
   * An optional instance of the portal data service.
   */
  portalDataService?: PortalDataService

  /**
   * An optional instance of the data source service.
   */
  dataSourceService?: DataSourceService

  /**
   * Fetch data sources by category and optional level.
   *
   * @param category Data source category
   * @param level Level for data source
   * @param columns Columns available for the data source category
   */
  fetchDataSources?(
    dataSourceCategory: string,
    level?: string,
    columns?: ProjectContentColumn[]
  ): Promise<DataSource[]>

  /**
   * Fetch chart data for a view
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param chartConfigurationListName List name for chart configuration
   * @param siteId Site ID
   */
  fetchChartData?(
    currentView: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    chartConfigurationListName: string,
    siteId: string
  ): Promise<{ charts: any; chartData: any; contentTypes: any }>

  /**
   * Get portfolio configuration from SharePoint lists.
   *
   * This includes:
   * - `columns` - Project columns
   * - `refiners` - Refinable columns
   * - `views` - Portfolio overview views
   * - `programs` - Programs
   * - `viewsUrls` - Portfolio views list form URLs
   * - `columnUrls` - Project columns list form URLs
   * - `userCanAddViews` - User can add portfolio views
   */
  getPortfolioConfig?(): Promise<IPortfolioOverviewConfiguration>

  /**
   * Get aggregated list config for the given category.
   *
   * Returns `views`, `viewsUrls`, `columnUrls` and `level`.
   *
   * @param category Category for data source
   * @param level Level for data source
   */
  getAggregatedListConfig?(category: string): Promise<IPortfolioAggregationConfiguration>

  /**
   * Do a dynamic amount of `sp.search` calls based on the amount of projects
   * to avoid 4096 character limitation by SharePoint. Uses `this.aggregatedQueryBuilder`
   * to create queries and `Promise.all` to execute them and flatten the results.
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   */
  fetchDataForViewBatch?(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    hubSiteId: any
  ): Promise<IPortfolioViewData>

  /**
   * Fetch data for view. Items and managed properties are returned.
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   */
  fetchDataForView?(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    hubSiteId: any
  ): Promise<IPortfolioViewData>

  /**
   * Fetch data for regular view
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property
   */
  fetchDataForRegularView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string | string[],
    siteIdProperty?: string
  ): Promise<IPortfolioViewData>

  /**
   * Fetch data for manager view.
   *
   * @param view View
   * @param configuration Configuration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property (defaults to **GtSiteIdOWSTEXT**)
   */
  fetchDataForManagerView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string | string[],
    siteIdProperty?: string
  ): Promise<IPortfolioViewData>

  /**
   * Checks if the current is in the specified group.
   *
   * @param groupName
   */
  isUserInGroup?(groupName: string): Promise<boolean>

  /**
   * Fetches data for the Projecttimeline project.
   *
   * @param timelineConfig Timeline configuration
   */
  fetchTimelineProjectData?(
    timelineConfig: any[]
  ): Promise<{ reports: any[]; configElement: TimelineConfigurationModel }>

  /**
   *  Fetches items from timeline content list
   *
   * * Fetching list items
   * * Maps the items to `TimelineContentModel`
   *
   * @description Used in `ProjectTimeline`
   */
  fetchTimelineContentItems?(timelineConfig: any[]): Promise<TimelineContentModel[]>

  /**
   * Fetches configuration data for the Project Timeline and
   * maps them to `TimelineContentModel`.
   *
   * @param configItemTitle Configuration item title
   * @param dataSourceName Data source name
   * @param timelineConfig Timeline configuration
   */
  fetchTimelineAggregatedContent?(
    configItemTitle: string,
    dataSourceName: string,
    timelineConfig: any[]
  ): Promise<TimelineContentModel[]>

  /**
   * Fetches configuration data for the Project Timeline and
   * maps them to `TimelineConfigurationModel`.
   */
  fetchTimelineConfiguration?(): Promise<TimelineConfigurationModel[]>

  /**
   * Fetching enriched projects by combining list items from projects list,
   * Graph Groups and site users. The result are cached in `localStorage`
   * for 30 minutes. Projects with lifecycle stage `Avsluttet` are excluded, and
   * the projects are sorted by Title ascending.
   */
  fetchEnrichedProjects?(): Promise<ProjectListModel[]>

  /**
   * Fetch projects from the projects list. If a data source is specified,
   * the projects are filtered using the `odataQuery` property from the
   * specified view.
   *
   * @param configuration Configuration
   * @param dataSource Data source
   */
  fetchProjects?(
    configuration?: IPortfolioAggregationConfiguration,
    dataSource?: string
  ): Promise<any[]>

  /**
   * Fetch project sites using search.
   *
   * @param rowLimit Row limit
   * @param sortProperty Sort property
   * @param sortDirection Sort direction
   */
  fetchProjectSites(
    rowLimit: number,
    sortProperty: 'Created' | 'Title',
    sortDirection: SortDirection
  ): Promise<ISearchResult[]>

  /**
   * Fetch items with data source name. If the data source is a benefit overview,
   * the items are fetched using `fetchBenefitItemsWithSource`.
   *
   * The properties 'FileExtension' and 'ServerRedirectedURL' is always added to the select properties.
   *
   * @param dataSourceName Data source name
   * @param selectProperties Select properties
   */
  fetchItemsWithSource?(
    dataSourceName: string,
    selectProperties: string[],
    includeSelf?: boolean
  ): Promise<any[]>

  /**
   * Fetch benefit items with the specified `dataSource` and `selectProperties`. The result
   * is transformed into `Benefit`, `BenefitMeasurement` and `BenefitMeasurementIndicator` objects
   * which is the main difference from `_fetchItems`.
   *
   * @param dataSource Data source
   * @param selectProperties Select properties
   */
  fetchBenefitItemsWithSource?(
    dataSource: DataSource,
    selectProperties: string[],
    dataSourceCategory?: string
  ): Promise<any[]>

  /**
   * Adds a new column to the project columns list and adds the column to the specified view.
   *
   * @param properties Properties for the new column (`Id` will be omitted)
   * @param view The view to add the column to
   */
  addColumnToPortfolioView?(
    properties: SPProjectColumnItem,
    view: PortfolioOverviewView
  ): Promise<boolean>
}
