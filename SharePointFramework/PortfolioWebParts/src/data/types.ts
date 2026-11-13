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
import { Idea } from 'components/IdeaModule'
import { IdeaConfigurationModel } from 'models'
import strings from 'PortfolioWebPartsStrings'

/** A portfolio row identified by project, report series and optional source hub. */
export interface IFetchDataForViewItemResult extends ISearchResult {
  SiteId: string
  _hubId?: string
  _hubTitle?: string
  _hubUrl?: string

  /**
   * Synthetic unique row key on the format `${SiteId}_${scopeKey}`. A project
   * with multiple report series ("delprosjekter") yields one row per series,
   * so `SiteId` alone is not unique.
   */
  key?: string

  /**
   * Scope key ("delprosjekt") for the report series the row represents.
   * `undefined` for the default series row.
   */
  ScopeKey?: string
  [key: string]: any
}

/** View rows, available managed properties and any unreadable merged portfolios. */
export type IPortfolioViewData = {
  items: IFetchDataForViewItemResult[]
  managedProperties?: string[]
  /**
   * The portfolios a merged view could not read, which the overview tells of.
   */
  failedPortfolios?: PortfolioInstance[]
  /**
   * What each of `failedPortfolios` failed with, in the same order. Usage statistics count each
   * by its error code; the errors are shown nowhere.
   */
  failedPortfolioErrors?: unknown[]
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
   * Include projects with a completed or closed lifecycle status in the current UI language.
   * Defaults to `false`, which is the long-standing behaviour — closed projects
   * are dropped after fetching. Opting in leaves them in the result so callers
   * (e.g. the `ProjectList` verticals) can decide per view whether to show them.
   *
   * Note: this does not affect the query or the shared items cache, which have
   * always contained closed projects; only the post-fetch filter.
   */
  includeClosed?: boolean

  /**
   * Primary field
   */
  primaryField?: string

  /**
   * Secondary field
   */
  secondaryField?: string
}

/** Data operations available to portfolio web parts and their shared components. */
export interface IPortfolioWebPartsDataAdapter {
  /**
   * Configuring the `DataAdapter` enabling use of the `DataSourceService` and `PortalDataService`
   *
   * The `dataSourceService` is dependent on the `portalDataService` being configured, as it needs
   * `portalDataService.web` to be passed as a parameter to its constructor.
   *
   * @param spfxContext Retained for adapter compatibility; the portfolio adapter uses its constructor context.
   * @param configuration Retained for adapter compatibility; unused by the portfolio adapter.
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
   */
  fetchDataSources?(
    dataSourceCategory: string,
    level?: string,
    columns?: ProjectContentColumn[]
  ): Promise<DataSource[]>

  /**
   * Get configuration from the adapter's configured portfolio.
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
   * Read the primary portfolio with its existing configuration, then each other
   * included portfolio with a separate adapter. Secondary failures are reported in the result.
   *
   * @param view View configuration from the primary (first included) portfolio
   * @param portfolios Array of portfolio instances to fetch data from; portfolios with includeInMergedView === false are ignored
   */
  fetchMergedViewData?(
    view: PortfolioOverviewView,
    portfolios: PortfolioInstance[],
    primaryConfiguration: IPortfolioOverviewConfiguration
  ): Promise<IPortfolioViewData>

  /**
   * Get aggregated list config for the given category.
   *
   * Includes views, columns, refiners, form URLs and available levels.
   */
  getAggregatedListConfig?(category: string): Promise<IPortfolioAggregationConfiguration>

  /**
   * Optional batched-view operation; the portfolio DataAdapter does not implement it.
   */
  fetchDataForViewBatch?(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    hubSiteId: any
  ): Promise<IPortfolioViewData>

  /**
   * Fetch view rows and managed properties, choosing the regular or manager path.
   */
  fetchDataForView?(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    hubSiteId: any
  ): Promise<IPortfolioViewData>

  /**
   * Build report-series rows from accessible project sites.
   *
   * @param siteIdProperty Site ID property (defaults to **GtSiteIdOWSTEXT**)
   */
  fetchDataForRegularView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string | string[],
    siteIdProperty?: string
  ): Promise<IPortfolioViewData>

  /**
   * Build report-series rows from project items, even without an accessible site result.
   *
   * @param siteIdProperty Site ID property (defaults to **GtSiteIdOWSTEXT**)
   */
  fetchDataForManagerView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string | string[],
    siteIdProperty?: string
  ): Promise<IPortfolioViewData>

  /**
   * Check whether the current user can view the named SharePoint group's membership.
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
   * Fetch project filter values and budget reports for the timeline.
   */
  fetchTimelineProjectData?(
    timelineConfig: any[]
  ): Promise<{ reports: any[]; configElement: TimelineConfigurationModel }>

  /**
   * Map portfolio-visible timeline-list items to configured timeline content.
   */
  fetchTimelineContentItems?(timelineConfig: any[]): Promise<TimelineContentModel[]>

  /**
   * Map dated deliveries from a data source to configured timeline content.
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
   * Closed/completed projects are excluded unless requested; results are sorted by title.
   */
  fetchEnrichedProjects?(fields?: IEnrichedProjectsFields): Promise<ProjectListModel[]>

  /**
   * Lightweight projects fetch — only reads the Projects list items, skipping
   * the site / membership / user lookups. Shares the items cache with
   * {@link fetchEnrichedProjects}, so co-located webparts reuse the network
   * call. Membership and access are false; personas have no user data.
   */
  fetchProjects?(fields?: IEnrichedProjectsFields): Promise<ProjectListModel[]>

  /**
   * Fetches project-level refiner values via search, keyed by siteId. Used by
   * components that render child items (PortfolioAggregation on risks /
   * benefits etc.) and need to join each item to its parent project's filter
   * values. Same data path as `ProjectTimeline`.
   */
  fetchProjectRefinerValues?(refiners: any[]): Promise<Map<string, Record<string, any>>>

  /**
   * Fetching enriched project by combining list item from projects list,
   * Graph Groups and site users. The result are cached in `localStorage`
   * for 30 minutes.
   *
   * @param hubContext Optional hub context for cross-hub data access
   */
  fetchEnrichedProject?(
    siteId: string,
    hubContext?: IHubContext,
    fields?: IEnrichedProjectsFields
  ): Promise<ProjectListModel>

  /**
   * Fetch projects from the projects list filtered by the `odataQuery`
   * property from the specified data source view.
   * Return undefined when no project-level filter applies.
   */
  fetchProjectsByDataSource?(
    configuration?: IPortfolioAggregationConfiguration,
    dataSource?: string
  ): Promise<any[]>

  /**
   * Fetch project sites using search.
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
   * FileExtension and ServerRedirectedURL are selected for non-benefit data sources.
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
   */
  fetchBenefitItemsWithSource?(
    dataSource: DataSource,
    selectProperties: string[],
    dataSourceCategory?: string
  ): Promise<any[]>

  /**
   * Read the named idea configuration, falling back to the first item or null.
   */
  getIdeaConfiguration?(
    listName: string,
    configurationName: string
  ): Promise<IdeaConfigurationModel>

  /**
   * Read registered and processing ideas with their editable fields and columns.
   */
  getIdeasData?(configuration: IdeaConfigurationModel): Promise<Idea>
}

/** Hub identity, list names and merged-view participation for a portfolio. */
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
 * Wrap a portfolio-configuration failure in a localized warning, preserving its stack. The error
 * it was made from is kept as its `cause`, as `errorWithCause` keeps one: the user sees the
 * generic text, and usage statistics count the failure by the HTTP status of what the hub
 * answered.
 */
export const GetPortfolioConfigError = (error: Error): ErrorWithIntent => {
  const e = new ErrorWithIntent(
    strings.GetPortfolioConfigErrorText,
    'warning',
    strings.GetPortfolioConfigErrorTitle
  )
  e.stack = error.stack
  // Not enumerable, as the native `cause` is not: it follows the error into no spread.
  Object.defineProperty(e, 'cause', {
    value: error,
    writable: true,
    configurable: true,
    enumerable: false
  })
  return e
}

/** Hub identity and optional SPFx context for cross-hub project-card reads. */
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
