import { WebPartContext } from '@microsoft/sp-webpart-base'
import { ISiteUserInfo, SPFI } from '@pnp/sp/presets/all'
import { ISearchResult, SortDirection } from '@pnp/sp/search'
import {
  DataSource,
  DataSourceService,
  IGraphGroup,
  PortalDataService,
  PortfolioOverviewView,
  ProjectContentColumn,
  ProjectListModel,
  SPProjectItem,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library'
import { IPortfolioAggregationConfiguration, IPortfolioOverviewConfiguration } from '../components'
import { IPersonaSharedProps } from '@fluentui/react'
import { IProvisionRequestItem } from 'interfaces/IProvisionRequestItem'
import { ConfigurationItem } from 'components/IdeaModule'

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
   * An optional instance of the SPFI service.
   */
  sp?: SPFI

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
   * @param siteIdProperty Site ID property (defaults to **GtSiteIdOWSTEXT**)
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
   * Search for users using `_sp.profiles.clientPeoplePickerSearchUser`.
   *
   * @param queryString Query string
   * @param selectedItems Selected items that should be excluded from the result
   * @param maximumEntitySuggestions Maximum entity suggestions
   */
  clientPeoplePickerSearchUser?(
    queryString: string,
    selectedItems: any[],
    maximumEntitySuggestions?: number
  ): Promise<IPersonaSharedProps[]>

  /**
   * Retrieves the configuration from the "Provisioning Request Settings" list
   *
   * @returns A Promise that resolves to an array containing the configuration.
   */
  getProvisionRequestSettings?(provisionUrl: string): Promise<any[]>

  /**
   * Retrieves the provision types from the "Provisioning Types" list
   *
   * @returns A Promise that resolves to a Map containing the types.
   */
  getProvisionTypes?(provisionUrl: string): Promise<Record<string, any>>

  /**
   * Ensure users in the provision site and return their IDs.
   *
   * @param users Users to ensure
   */
  getProvisionUsers?(users: any[], provisionUrl: string): Promise<Promise<number | null>[]>

  /**
   * Adds a new provision request to the provisioning requests list
   *
   * @param properties Properties for the new provision request (`Id` will be omitted)
   * @param provisionUrl Url for the provisioning site
   *
   */
  addProvisionRequests?(properties: IProvisionRequestItem, provisionUrl: string): Promise<boolean>

  /**
   * Deletes a provision request item from the provisioning requests list
   *
   * @param requestId Id of the request to delete
   * @param provisionUrl Url for the provisioning site
   *
   */
  deleteProvisionRequest?(requestId: number, provisionUrl: string): Promise<boolean>

  /**
   * Retrieves the provision types from the "Provisioning Requests" list
   *
   * @param user User to fetch the provision requests for
   * @param provisionUrl Url for the provisioning site
   *
   * @returns A Promise that resolves to an array of containing provision requests.
   */
  fetchProvisionRequests?(user: any, provisionUrl: string): Promise<any[]>

  /**
   * Retrieves the team templates from the "Teams Templates" list
   *
   * @returns A Promise that resolves to a Map containing the templates.
   */
  getTeamTemplates?(provisionUrl: string): Promise<Record<string, any>>

  /**
   * Checks if a site exists based on its proposed URL
   *
   * @param siteUrl Site URL
   *
   */
  siteExists?(siteUrl: string): Promise<boolean>

  /**
   * Retrieves the configuration from the "Idékonfigurasjon" list
   *
   * @returns A Promise that resolves to an array containing the configuration.
   */
  getConfiguration?(listName: string): Promise<ConfigurationItem[]>
}
