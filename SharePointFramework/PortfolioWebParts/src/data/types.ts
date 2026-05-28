import { WebPartContext } from '@microsoft/sp-webpart-base'
import { ISiteUserInfo, SPFI } from '@pnp/sp/presets/all'
import { ISearchResult, SortDirection } from '@pnp/sp/search'
import {
  DataSource,
  DataSourceService,
  ErrorWithIntent,
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
import { Idea } from 'components/IdeaModule'
import { IdeaConfigurationModel } from 'models'
import strings from 'PortfolioWebPartsStrings'

export interface IFetchDataForViewItemResult extends ISearchResult {
  SiteId: string
  _hubId?: string
  _hubTitle?: string
  _hubUrl?: string
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

/**
 * Additional fields to include when fetching enriched projects
 */
export interface IEnrichedProjectsFields {
  /**
   * Primary user field
   */
  primaryUserField?: string

  /**
   * Secondary user field
   */
  secondaryUserField?: string

  /**
   * Primary field
   */
  primaryField?: string

  /**
   * Secondary field
   */
  secondaryField?: string
}

export interface IPortfolioWebPartsDataAdapter {
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
  configure(
    spfxContext?: WebPartContext,
    configuration?: any,
    portfolio?: PortfolioInstance
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
   * Get portfolio configuration from SharePoint lists. Optionally from
   * a specific portfolio instance.
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
  getPortfolioConfig?(portfolio?: PortfolioInstance): Promise<IPortfolioOverviewConfiguration>

  /**
   * Fetches data from multiple portfolio instances and merges them into a single view.
   *
   * Approach:
   * 1. Configure and fetch data from the primary (first) included portfolio - this gives us the base configuration
   * 2. Loop through the remaining included portfolios (after filtering by `includeInMergedView`) starting after the primary
   *    portfolio, and merge their data into the result
   *
   * @param view View configuration from the primary (first included) portfolio
   * @param portfolios Array of portfolio instances to fetch data from; portfolios with includeInMergedView === false are ignored
   * @param primaryConfiguration Configuration from the primary portfolio
   * @returns Merged portfolio view data with items from all included hubs
   */
  fetchMergedViewData?(
    view: PortfolioOverviewView,
    portfolios: PortfolioInstance[],
    primaryConfiguration: IPortfolioOverviewConfiguration
  ): Promise<IPortfolioViewData>

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
   * Checks if the current user is in the specified SharePoint group.
   *
   * @param groupName Group name
   */
  isUserInGroup?(groupName: string): Promise<boolean>

  /**
   * Global settings loaded from the portal site, indexed by `GtSettingsKey`.
   * Only populated when the adapter was configured with `loadGlobalSettings: true`
   * (currently true for `BaseProgramWebPart`, but not for the portfolio-side
   * `DataAdapter`). Optional so consumers can read it null-safely.
   */
  globalSettings?: Map<string, string>

  /**
   * Fetches data for the Projecttimeline project.
   *
   * @param timelineConfig Timeline configuration
   */
  fetchTimelineProjectData?(
    timelineConfig: any[]
  ): Promise<{ reports: any[]; configElement: TimelineConfigurationModel }>

  /**
   *  Fetches items from timeline content list and maps them to `TimelineContentListModel`.
   *
   * * Fetching list items
   * * Maps the items to `TimelineContentListModel`
   *
   * @param timelineConfig Timeline configuration
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
   * Fetches fully enriched projects (Projects list + site access + group
   * membership + users). Results go through the tiered projects cache.
   * Closed/completed projects are excluded and the list is sorted by title.
   *
   * @param fields Additional fields to include in the query
   */
  fetchEnrichedProjects?(fields?: IEnrichedProjectsFields): Promise<ProjectListModel[]>

  /**
   * Lightweight projects fetch — only reads the Projects list items, skipping
   * the site / membership / user lookups. Shares the items cache with
   * {@link fetchEnrichedProjects}, so co-located webparts reuse the network
   * call. Persona, membership and access fields are left undefined.
   *
   * @param fields Additional fields to include in the query
   */
  fetchProjects?(fields?: IEnrichedProjectsFields): Promise<ProjectListModel[]>

  /**
   * Fetches project-level refiner values via search, keyed by siteId. Used by
   * components that render child items (PortfolioAggregation on risks /
   * benefits etc.) and need to join each item to its parent project's filter
   * values. Same data path as `ProjectTimeline`.
   *
   * @param refiners Project columns whose values should be returned
   */
  fetchProjectRefinerValues?(refiners: any[]): Promise<Map<string, Record<string, any>>>

  /**
   * Fetching enriched project by combining list item from projects list,
   * Graph Groups and site users. The result are cached in `localStorage`
   * for 30 minutes.
   *
   * @param siteId Site ID to fetch the project
   * @param hubContext Optional hub context for cross-hub data access
   */
  fetchEnrichedProject?(siteId: string, hubContext?: IHubContext): Promise<ProjectListModel>

  /**
   * Fetch projects from the projects list filtered by the `odataQuery`
   * property from the specified data source view.
   *
   * @param configuration Configuration
   * @param dataSource Data source
   */
  fetchProjectsByDataSource?(
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
   * Retrieves the Site templates from the "Site Templates" list
   *
   * @returns A Promise that resolves to a Map containing the templates.
   */
  getSiteTemplates?(provisionUrl: string): Promise<Record<string, any>>

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
   * Adds project data to the ProjectData list to store project information that
   * will be used when setting up the project
   *
   * @param properties Properties to add to the ProjectData list
   * @param hubUrl Url for the hub site
   */
  addProjectData?(
    properties: Record<string, any>,
    hubUrl: string
  ): Promise<Record<string, any> | void>

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
   * Retrieves the sensitivity labels from the "IP Labels" list
   *
   * @returns A Promise that resolves to a Map containing the labels.
   */
  getSensitivityLabels?(provisionUrl: string): Promise<Record<string, any>>

  /**
   * Retrieves the retention labels from the "Retention Labels" list
   *
   * @returns A Promise that resolves to a Map containing the labels.
   */
  getRetentionLabels?(provisionUrl: string): Promise<Record<string, any>>

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
  getIdeaConfiguration?(
    listName: string,
    configurationName: string
  ): Promise<IdeaConfigurationModel>

  /**
   * Retrieves the data for the ideas from the "Idéregistrering" list
   *
   * @returns A Promise that resolves to an object containing the data for the ideas.
   */
  getIdeasData?(configuration: IdeaConfigurationModel): Promise<Idea>

  /**
   * Load Teams app configuration from TeamsAppConfig.json
   *
   * @param provisionUrl The provision site URL
   * @returns Configuration object or null if file doesn't exist
   */
  loadTeamsConfig?(provisionUrl: string): Promise<any | null>

  /**
   * Save Teams app configuration to TeamsAppConfig.json
   *
   * @param provisionUrl The provision site URL
   * @param config Configuration object to save
   */
  saveTeamsConfig?(provisionUrl: string, config: any): Promise<void>

  /**
   * Delete Teams app configuration file (TeamsAppConfig.json)
   *
   * @param provisionUrl The provision site URL
   */
  deleteTeamsConfig?(provisionUrl: string): Promise<void>

  /**
   * Check if current user is admin of the provision site
   *
   * @param provisionUrl The provision site URL
   * @returns True if user is site admin
   */
  isProvisionSiteAdmin?(provisionUrl: string): Promise<boolean>

  /**
   * Resolve a hub site by its ID using the HubSites REST API.
   *
   * @param hubSiteId The hub site GUID
   * @returns Hub site info with id and title, or null if not found
   */
  resolveHubSiteById?(hubSiteId: string): Promise<{ hubSiteId: string; title: string } | null>
}

export type PortfolioInstance = {
  uniqueId: string
  title: string
  url: string
  projectListName: string
  projectStatusListName: string
  projectContentColumnsListName: string
  columnsListName: string
  columnConfigListName: string
  viewsListName: string
  iconName?: string
  includeInMergedView?: boolean
}

/**
 * Generates an error for when the user does not have access to the portfolio.
 *
 * @param error The error that occurred
 */
export const GetPortfolioConfigError = (error: Error): ErrorWithIntent => {
  const e = new ErrorWithIntent(
    strings.GetPortfolioConfigErrorText,
    'warning',
    strings.GetPortfolioConfigErrorTitle
  )
  e.stack = error.stack
  return e
}

export interface IHubContext {
  /**
   * Hub site ID (GUID)
   */
  hubSiteId: string

  /**
   * Hub site URL
   */
  hubSiteUrl: string

  /**
   * SPFx context configured for the hub site
   */
  spfxContext?: any
}
