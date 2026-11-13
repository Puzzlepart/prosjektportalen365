import { WebPartContext } from '@microsoft/sp-webpart-base'
import { PnPClientStorage, dateAdd } from '@pnp/core'
import {
  ISearchResult,
  QueryPropertyValueType,
  SearchQueryInit,
  SortDirection
} from '@pnp/sp/search'
import * as strings from 'ProgramWebPartsStrings'
import * as cleanDeep from 'clean-deep'
import MSGraph from 'msgraph-helper'
import { IPortfolioOverviewConfiguration } from 'pp365-portfoliowebparts/lib/components'
import { IPortfolioAggregationConfiguration } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import {
  IFetchDataForViewItemResult,
  IPortfolioViewData,
  IPortfolioWebPartsDataAdapter
} from 'pp365-portfoliowebparts/lib/data'
import * as PortfolioWebPartsDataConfig from 'pp365-portfoliowebparts/lib/data/config'
import {
  Benefit,
  BenefitMeasurement,
  BenefitMeasurementIndicator
} from 'pp365-portfoliowebparts/lib/models'
import {
  buildAggregatedSiteIdQueries,
  DataSource,
  DataSourceService,
  errorWithCause,
  errorWithStatus,
  expandRowsPerStatusSeries,
  getAllItems,
  getOrFetchProjectsCache,
  groupLatestReportBySeries,
  parseScopedSiteId,
  IGraphGroup,
  IProjectDataServiceParams,
  ISPDataAdapterBaseConfiguration,
  PortfolioOverviewView,
  ProjectColumn,
  ProjectContentColumn,
  ProjectDataService,
  ProjectInformationChildProject,
  ProjectListModel,
  searchAggregatedItems,
  sortStatusReportsLatestFirst,
  SPDataAdapterBase,
  SPProjectItem,
  TimelineConfigurationModel,
  TimelineContentModel,
  format
} from 'pp365-shared-library'
import { Logger, LogLevel } from '@pnp/logging'
import _ from 'underscore'
import { DEFAULT_SEARCH_SETTINGS, IProgramHub, IProjectsData } from './types'
import { IList } from '@pnp/sp/lists'
import { IItem } from '@pnp/sp/items'
import { PermissionKind, Web } from '@pnp/sp/presets/all'
import resource from 'SharedResources'
import { removeChildProjectsFromProgram } from './childProjectRemoval'
import {
  HUB_SITE_PROJECT_ITEM_PROPERTIES,
  HUB_SITE_PROJECT_SITE_PROPERTIES,
  hubSiteProjectsCacheKey,
  toHubSiteProjects,
  toStoredChildProject
} from './hubSiteProjects'

enum ParentProjectOperation {
  Add = 'add',
  Remove = 'remove'
}

/**
 * Loads program views, aggregated content and timelines, and maintains child-project links.
 */

export class SPDataAdapter
  extends SPDataAdapterBase<ISPDataAdapterBaseConfiguration>
  implements IPortfolioWebPartsDataAdapter
{
  public project: ProjectDataService
  public dataSourceService: DataSourceService
  public childProjects: ProjectInformationChildProject[]
  private _name = 'SPDataAdapter'
  private _propertyList: IList
  private _propertyItem: IItem
  private _hubWebs: Map<string, any>

  /**
   * Configures program properties, hub access and the data-source service for this web part.
   */
  public async configure(
    spfxContext: WebPartContext,
    configuration: ISPDataAdapterBaseConfiguration
  ) {
    await super.configure(spfxContext, configuration)
    if (this.portalDataService?.web) {
      this.dataSourceService = new DataSourceService(this.portalDataService.web)
    } else {
      console.warn(
        '(SPDataAdapter) (configure) Portal data service has no `web` — hub site resolution may have failed. Data source operations will be unavailable.'
      )
    }
    this.project = new ProjectDataService({
      ...this.settings,
      spfxContext,
      entityService: this.entityService,
      propertiesListName: resource.Lists_ProjectProperties_Title
    } as IProjectDataServiceParams)
    this._propertyList = this.sp.web.lists.getByTitle(resource.Lists_ProjectProperties_Title)
    this._hubWebs = new Map()
  }

  /**
   * Replaces the hub-web map with entries having both a hub id and URL.
   */
  public initializeHubWebs(hubs: IProgramHub[]): void {
    this._hubWebs.clear()
    hubs?.forEach((hub) => {
      if (hub.hubSiteId && hub.url) {
        this._hubWebs.set(hub.hubSiteId, Web([this.sp.web, hub.url]))
      }
    })
  }

  /** Loads hub columns, refiners, views and view-editing permissions for the project overview. */
  public async getPortfolioConfig(): Promise<IPortfolioOverviewConfiguration> {
    // eslint-disable-next-line prefer-const
    let [columnConfig, columns, views, viewsUrls, columnUrls, userCanAddViews] = await Promise.all([
      this.portalDataService.getProjectColumnConfig(),
      this.portalDataService.getProjectColumns(),
      this.portalDataService.getPortfolioOverviewViews(),
      this.portalDataService.getListFormUrls('PORTFOLIO_VIEWS'),
      this.portalDataService.getListFormUrls('PROJECT_COLUMNS'),
      this.portalDataService.currentUserHasPermissionsToList(
        'PORTFOLIO_VIEWS',
        PermissionKind.AddListItems
      )
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
      programs: [],
      userCanAddViews,
      hubSiteId: this.spfxContext.pageContext.legacyPageContext.hubSiteId
    } as IPortfolioOverviewConfiguration
  }

  /** Loads content columns, data sources and project refiners for an aggregation category. */
  public async getAggregatedListConfig(
    category: string,
    level: string = resource.Lists_DataSources_Level_ParentProgram
  ): Promise<IPortfolioAggregationConfiguration> {
    try {
      if (!this.portalDataService?.web) {
        // With the status of the answer that took the hub out of reach, where the service kept
        // one: usage statistics count the failure by it, as denied permission for a 401 or 403.
        throw errorWithStatus(
          '(SPDataAdapter) (getAggregatedListConfig) Portal data service is not initialized (hub site unreachable).',
          this.portalDataService?.unavailableStatus
        )
      }
      const columns = await this.portalDataService.fetchProjectContentColumns(
        'PROJECT_CONTENT_COLUMNS',
        category,
        level
      )
      const [views, viewsUrls, columnUrls, projectColumns] = await Promise.all([
        this.fetchDataSources(category, level, columns),
        this.portalDataService.getListFormUrls('DATA_SOURCES'),
        this.portalDataService.getListFormUrls('PROJECT_CONTENT_COLUMNS'),
        this.portalDataService.getProjectColumns().catch(() => [])
      ])
      const refiners = (projectColumns ?? []).filter((col) => col.isRefinable)
      return {
        columns,
        views,
        viewsUrls,
        columnUrls,
        level,
        refiners
      } as IPortfolioAggregationConfiguration
    } catch (error) {
      console.error(
        '(SPDataAdapter) (getAggregatedListConfig) Failed to load aggregated list config:',
        error
      )
      throw error
    }
  }

  /** Selects manager or regular view loading using the current department and group visibility. */
  public async fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[]
  ): Promise<IPortfolioViewData> {
    siteId = this.spfxContext.pageContext.legacyPageContext.departmentId
    const isCurrentUserInManagerGroup = await this.isUserInGroup(
      resource.Security_SiteGroup_PortfolioInsight_Title
    )
    if (isCurrentUserInManagerGroup) {
      return await this.fetchDataForManagerView(view, configuration, siteId)
    } else {
      return await this.fetchDataForRegularView(view, configuration, siteId)
    }
  }

  /** Builds view rows from accessible project sites, expanding each latest status-report series. */
  public async fetchDataForRegularView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IPortfolioViewData> {
    try {
      const { projects, sites, statusReportsBySite } = await this._fetchDataForView(
        view,
        configuration,
        siteId,
        siteIdProperty
      )
      const items = sites.reduce<IFetchDataForViewItemResult[]>((acc, site) => {
        const project = projects.find((res) => res[siteIdProperty] === site.SiteId)
        const series = statusReportsBySite.get(site.SiteId)
        return acc.concat(
          expandRowsPerStatusSeries(
            (statusReport) => ({
              ...(statusReport ?? {}),
              ...(project ?? {}),
              Title: site.Title,
              Path: site?.Path,
              SPWebUrl: site?.SPWebUrl,
              SiteId: site.SiteId
            }),
            series,
            siteIdProperty
          )
        )
      }, [])

      return { items }
    } catch (err) {
      throw err
    }
  }

  /** Builds view rows from project items, retaining rows even when their sites are not accessible. */
  public async fetchDataForManagerView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IPortfolioViewData> {
    try {
      const { projects, sites, statusReportsBySite } = await this._fetchDataForView(
        view,
        configuration,
        siteId,
        siteIdProperty
      )
      const items = projects.reduce<IFetchDataForViewItemResult[]>((acc, project) => {
        const site = sites.find((res) => res.SiteId === project[siteIdProperty])
        const series = statusReportsBySite.get(project[siteIdProperty])
        return acc.concat(
          expandRowsPerStatusSeries(
            (statusReport) => ({
              ...(statusReport ?? {}),
              ...project,
              Path: site?.Path,
              SPWebUrl: site?.SPWebUrl,
              SiteId: project[siteIdProperty]
            }),
            series,
            siteIdProperty
          )
        )
      }, [])

      return { items }
    } catch (err) {
      throw err
    }
  }

  /**
   * Builds batched child-project site filters to stay within SharePoint query limits.
   *
   * @param queryProperty Managed property containing the child project's site id.
   */
  public aggregatedQueryBuilder(
    queryProperty: string,
    maxQueryLength: number = 2500,
    maxProjects: number = 25
  ): string[] {
    return buildAggregatedSiteIdQueries(
      this.childProjects?.map((childProject) => childProject.siteId) ?? [],
      queryProperty,
      maxQueryLength,
      maxProjects
    )
  }

  /** Loads and combines project-item view rows for batched child-project site filters. */
  public async fetchDataForViewBatch(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IPortfolioViewData> {
    const queryArray = this.aggregatedQueryBuilder(siteIdProperty)
    const promises = queryArray.map(async (query) => {
      const { projects, sites, statusReportsBySite } = await this._fetchDataForView(
        view,
        configuration,
        siteId,
        siteIdProperty,
        query
      )
      return projects.reduce<IFetchDataForViewItemResult[]>((acc, project) => {
        const site = sites.find((res) => res.SiteId === project[siteIdProperty])
        const series = statusReportsBySite.get(project[siteIdProperty])
        return acc.concat(
          expandRowsPerStatusSeries(
            (statusReport) => ({
              ...(statusReport ?? {}),
              ...project,
              Path: site?.Path,
              SPWebUrl: site?.SPWebUrl,
              SiteId: project[siteIdProperty]
            }),
            series,
            siteIdProperty
          )
        )
      }, [])
    })
    const items = await Promise.all(promises).then((results) => _.flatten(results))
    return { items, managedProperties: [] }
  }

  /**
   * Joins view project items with department sites and latest published status-report series.
   */
  private async _fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
    siteIdProperty: string = 'GtSiteIdOWSTEXT',
    queryArray?: string
  ) {
    const searchQuery = `${queryArray ?? ''} ${view.searchQuery}`.trim()

    // Status reports for a scoped report series store
    // `GtSiteId` as `{siteId}-{scopeKey}`, so the child project site terms need
    // a trailing wildcard to match those reports as well. A full site GUID can
    // never be a prefix of another site GUID, so this cannot widen the result
    // set to other projects.
    const statusReportQueryArray = (queryArray ?? '').replace(
      new RegExp(`${siteIdProperty}:(\\S+)`, 'g'),
      `${siteIdProperty}:$1*`
    )

    const fetchAllResults = async (
      queryTemplate: string,
      selectProperties: string[],
      refiners?: string
    ) => {
      const searchInit = {
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: queryTemplate,
        SelectProperties: selectProperties,
        RowLimit: 500,
        StartRow: 0,
        ...(refiners && { Refiners: refiners })
      }

      const firstResponse = await this.sp.search(searchInit)
      const allResults = [...(firstResponse?.PrimarySearchResults ?? [])]

      while (allResults.length < (firstResponse?.TotalRows ?? 0)) {
        const response = await this.sp.search({
          ...searchInit,
          StartRow: allResults.length
        })
        allResults.push(...(response?.PrimarySearchResults ?? []))
      }

      return allResults
    }

    let [projects, sites, statusReports] = await Promise.all([
      fetchAllResults(searchQuery, [
        ...configuration.columns.map((f) => f.fieldName),
        siteIdProperty
      ]),
      fetchAllResults(`DepartmentId:{${siteId}} contentclass:STS_Site`, [
        'Path',
        'SPWebUrl',
        'Title',
        'SiteId'
      ]),
      fetchAllResults(
        `${statusReportQueryArray} DepartmentId:{${siteId}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:${resource.Choice_GtModerationStatus_Published}`,
        [...configuration.columns.map((f) => f.fieldName), siteIdProperty, 'ListItemId'],
        configuration.refiners.map((ref) => ref.fieldName).join(',')
      )
    ])

    projects = projects.map((item) => cleanDeep({ ...item }))
    sites = sites.map((item) => cleanDeep({ ...item }))
    statusReports = sortStatusReportsLatestFirst(statusReports).map((item) =>
      cleanDeep({ ...item })
    )
    sites = sites.filter(
      (site) => projects.filter((res) => res[siteIdProperty] === site.SiteId).length === 1
    )
    const statusReportsBySite = groupLatestReportBySeries(statusReports, siteIdProperty)

    return {
      projects,
      sites,
      statusReports,
      statusReportsBySite
    } as const
  }

  /**
   * Loads child-project timeline properties and unscoped published budget/cost reports.
   */
  public async fetchTimelineProjectData(timelineConfig: TimelineConfigurationModel[]) {
    const configuration = await this.getPortfolioConfig()
    const siteId = this.spfxContext.pageContext.site.id.toString()

    const { items } = await this.fetchDataForViewBatch(
      configuration.views[0],
      configuration,
      this.spfxContext.pageContext.legacyPageContext.hubSiteId
    )

    const data = items
      // Timeline rows are project-level facts — skip the extra rows a project
      // gets per scoped report series.
      .filter((item) => !item.ScopeKey)
      .map((item) => {
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
          siteId: item?.GtSiteIdOWSTEXT,
          properties
        }
      })
      .filter((item) => item.siteId !== siteId)

    const searchQuery = `ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:${resource.Choice_GtModerationStatus_Published}`
    const selectProperties = ['GtSiteIdOWSTEXT', 'GtCostsTotalOWSCURR', 'GtBudgetTotalOWSCURR']

    const statusReports = await this._fetchItems(
      searchQuery,
      selectProperties,
      false,
      'GtSiteIdOWSTEXT'
    )

    const reports = statusReports
      .filter((report) => !parseScopedSiteId(report?.GtSiteIdOWSTEXT).scopeKey)
      .map((report) => ({
        siteId: parseScopedSiteId(report?.GtSiteIdOWSTEXT).siteId,
        costsTotal: report?.GtCostsTotalOWSCURR,
        budgetTotal: report?.GtBudgetTotalOWSCURR
      }))
      .filter(Boolean)

    const configElement = _.find(timelineConfig, {
      title: resource.TimelineConfiguration_Project_Title
    })

    return { data, reports, configElement, columns: configuration.refiners }
  }

  /** Loads hub timeline items linked to program/child sites and enabled for program display. */
  public async fetchTimelineContentItems(timelineConfig: TimelineConfigurationModel[]) {
    const baseFields = [
      'Title',
      'GtTimelineTypeLookup/Title',
      'GtStartDate',
      'GtEndDate',
      'GtBudgetTotal',
      'GtCostsTotal',
      'GtDescription',
      'GtSiteIdLookup/Title',
      'GtSiteIdLookup/GtSiteId'
    ]

    let timelineItems: any[]
    try {
      timelineItems = await getAllItems(
        this.portalDataService.web.lists
          .getByTitle(resource.Lists_TimelineContent_Title)
          .items.select(...baseFields, 'GtTag')
          .expand('GtSiteIdLookup', 'GtTimelineTypeLookup')
      )
    } catch {
      timelineItems = await getAllItems(
        this.portalDataService.web.lists
          .getByTitle(resource.Lists_TimelineContent_Title)
          .items.select(...baseFields)
          .expand('GtSiteIdLookup', 'GtTimelineTypeLookup')
      )
    }

    return timelineItems
      .map((item) => {
        const type = item.GtTimelineTypeLookup && item.GtTimelineTypeLookup.Title
        const config = timelineConfig.find((col) => col.title === type)

        if (
          item?.GtSiteIdLookup?.GtSiteId &&
          this.childProjects.find(
            (child) =>
              child?.siteId === item?.GtSiteIdLookup?.GtSiteId ||
              item?.GtSiteIdLookup?.GtSiteId ===
                this?.spfxContext?.pageContext?.site?.id?.toString()
          )
        ) {
          if (item.GtSiteIdLookup?.GtSiteId && config?.showElementProgram) {
            return new TimelineContentModel(
              item.GtSiteIdLookup?.GtSiteId,
              item.GtSiteIdLookup?.Title,
              item.Title,
              config?.title,
              item.GtStartDate,
              item.GtEndDate,
              item.GtDescription,
              item.GtTag,
              item.GtBudgetTotal,
              item.GtCostsTotal
            ).usingConfig(config)
          }
        }
      })
      .filter((p) => p)
  }

  /**
   * Loads hub timeline definitions, including program visibility and filtering settings.
   */
  public async fetchTimelineConfiguration() {
    const timelineConfig = await getAllItems(
      this.portalDataService.web.lists
        .getByTitle(resource.Lists_TimelineConfiguration_Title)
        .items.select(
          'GtSortOrder',
          'Title',
          'GtHexColor',
          'GtTimelineCategory',
          'GtElementType',
          'GtShowElementPortfolio',
          'GtShowElementProgram',
          'GtTimelineFilter'
        )
    )

    return timelineConfig.map((item) => new TimelineConfigurationModel(item)).filter((p) => p)
  }

  /** Builds timeline entries from dated deliveries when their configuration allows program display. */
  public async fetchTimelineAggregatedContent(
    configItemTitle: string,
    dataSourceName: string,
    timelineConfig: TimelineConfigurationModel[]
  ) {
    const config = timelineConfig.find(
      (col) =>
        col.title === (configItemTitle || resource.TimelineConfiguration_ProjectDelivery_Title)
    )

    if (config?.showElementProgram) {
      const projectDeliveries = await this.fetchItemsWithSource(
        dataSourceName ?? resource.Lists_DataSources_Category_ProjectDeliveries_All,
        [
          'Title',
          'GtDeliveryDescriptionOWSMTXT',
          'GtDeliveryStartTimeOWSDATE',
          'GtDeliveryEndTimeOWSDATE',
          'GtTagOWSCHCS'
        ],
        true
      )
        .then((deliveries) => {
          return deliveries.filter(
            (delivery) => delivery.GtDeliveryStartTimeOWSDATE && delivery.GtDeliveryEndTimeOWSDATE
          )
        })
        .catch((error) => {
          throw error
        })

      return projectDeliveries
        .map((item) =>
          new TimelineContentModel(
            item.SiteId,
            item.SiteTitle,
            item.Title,
            config.title ?? configItemTitle,
            item.GtDeliveryStartTimeOWSDATE,
            item.GtDeliveryEndTimeOWSDATE,
            item.GtDeliveryDescriptionOWSMTXT,
            item.GtTagOWSCHCS
          ).usingConfig({
            sortOrder: 90,
            bgColorHex: '#384f61',
            timelineCategory: resource.TimelineConfiguration_Management_Category,
            elementType: resource.TimelineConfiguration_Bar_ElementType,
            timelineFilter: true,
            ...config
          })
        )
        .filter(Boolean)
    }
  }

  /** Searches the current hub's sites, excluding the hub itself, with the requested limit and sort. */
  public async fetchProjectSites(
    rowLimit: number,
    sortProperty: 'Created' | 'Title',
    sortDirection: SortDirection
  ): Promise<ISearchResult[]> {
    const hubSiteId = this.spfxContext.pageContext.legacyPageContext.hubSiteId
    const { PrimarySearchResults } = await this.sp.search({
      Querytext: `DepartmentId:{${this.spfxContext.pageContext.legacyPageContext.hubSiteId}} contentclass:STS_Site`,
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
    return PrimarySearchResults.filter((site) => hubSiteId !== site.SiteId)
  }

  /**
   * Builds program-scoped project models and marks the current user's Microsoft 365 group membership.
   */
  private _combineResultData({ items, memberOfGroups }: IProjectsData): ProjectListModel[] {
    let projects = items
      .map((item) => {
        const group = memberOfGroups.find((grp) => grp.id === item.GtGroupId)
        const model = new ProjectListModel(group?.displayName ?? item.Title, item)
        model.isUserMember = !!group
        return model
      })
      .filter((p) => p)

    projects = projects
      .map((project) => {
        return (this.childProjects ?? []).some(
          (child) =>
            child?.siteId === project?.siteId ||
            project?.siteId === this.spfxContext.pageContext.site.id.toString()
        )
          ? project
          : undefined
      })
      .filter((p) => p)

    return projects
  }

  /**
   * Reads non-closed projects from the hub list, caching them under the supplied program site id.
   */
  private async _fetchProjectItems(siteId: string): Promise<SPProjectItem[]> {
    return getOrFetchProjectsCache('items', siteId, () =>
      getAllItems<SPProjectItem>(
        this.portalDataService.web.lists
          .getByTitle(resource.Lists_Projects_Title)
          .items.select(...Object.keys(new SPProjectItem()))
          .filter(
            `GtProjectLifecycleStatus ne '${resource.Choice_GtProjectLifecycleStatus_Closed}' and GtProjectLifecycleStatus ne '${strings.LifecycleStatus_Closed}'`
          )
          .orderBy('Title')
      )
    )
  }

  private async _fetchMemberOfGroups(siteId: string): Promise<IGraphGroup[]> {
    return getOrFetchProjectsCache('memberOf', siteId, () =>
      MSGraph.Get<IGraphGroup[]>(
        '/me/memberOf/$/microsoft.graph.group',
        ['id', 'displayName'],

        "groupTypes/any(a:a%20eq%20'unified')"
      )
    )
  }

  /** Loads program-scoped project models enriched with the current user's group memberships. */
  public async fetchEnrichedProjects(): Promise<ProjectListModel[]> {
    await MSGraph.Init(this.spfxContext.msGraphClientFactory)
    const siteId = this.spfxContext.pageContext.site.id.toString()
    const [items, memberOfGroups] = await Promise.all([
      this._fetchProjectItems(siteId),
      this._fetchMemberOfGroups(siteId)
    ])
    const result: IProjectsData = { items, memberOfGroups }
    return this._combineResultData(result)
  }

  /**
   * Lightweight projects fetch for callers that only need Projects list data
   * (ProjectTimeline). Shares the items cache with {@link fetchEnrichedProjects}.
   */
  public async fetchProjects(): Promise<ProjectListModel[]> {
    const siteId = this.spfxContext.pageContext.site.id.toString()
    const items = await this._fetchProjectItems(siteId)
    const result: IProjectsData = { items, memberOfGroups: [] }
    return this._combineResultData(result)
  }

  /**
   * Fetches project-level refiner values via search, keyed by siteId. Program
   * mirror of `DataAdapter.fetchProjectRefinerValues` in PortfolioWebParts —
   * see there for rationale.
   */
  public async fetchProjectRefinerValues(
    refiners: ProjectColumn[]
  ): Promise<Map<string, Record<string, any>>> {
    const hubSiteId = this.spfxContext.pageContext.legacyPageContext.hubSiteId
    const isValidManagedProperty = (name: string | undefined) =>
      Boolean(name) && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
    const uniqueRefiners = refiners.filter(
      (r) => isValidManagedProperty(r.fieldName) && r.internalName
    )
    if (uniqueRefiners.length === 0 || !hubSiteId) return new Map()

    const siteIdProperty = 'GtSiteIdOWSTEXT'
    const selectProperties = _.uniq([...uniqueRefiners.map((r) => r.fieldName), siteIdProperty])

    const portfolioConfig = await this.getPortfolioConfig()
    const queryTemplate =
      portfolioConfig?.views?.[0]?.searchQuery ??
      `DepartmentId:{${hubSiteId}} contentclass:STS_Site`

    const results = await getOrFetchProjectsCache('refiners', hubSiteId, () =>
      this._fetchItems(queryTemplate, selectProperties, false, 'GtSiteIdOWSTEXT')
    )

    const map = new Map<string, Record<string, any>>()
    for (const item of results) {
      const itemSiteId = (item as any)[siteIdProperty]
      if (!itemSiteId) continue
      const properties: Record<string, any> = {}
      for (const refiner of uniqueRefiners) {
        const value = (item as any)[refiner.fieldName]
        if (value !== undefined && value !== null && value !== '') {
          properties[refiner.internalName] = value
        }
      }
      map.set(itemSiteId, properties)
    }
    return map
  }

  /** Applies a data source's OData project filter; undefined means no project-list filtering. */
  public async fetchProjectsByDataSource(
    configuration?: IPortfolioAggregationConfiguration,
    dataSource?: string
  ): Promise<any[]> {
    const odataQuery = (configuration?.views || []).find((v) => v.title === dataSource)?.odataQuery
    // Returns `undefined` (not `[]`) when there is no OData query on the
    // data source — the reducer interprets `undefined` as "don't filter
    // items by the projects list", while `[]` would filter everything out.
    if (!odataQuery || dataSource?.includes(`(${strings.ProjectLevel})`)) {
      return undefined
    }
    if (!this.portalDataService?.web) {
      return undefined
    }
    return await this.portalDataService.web.lists
      .getByTitle(resource.Lists_Projects_Title)
      .items.filter(`${odataQuery}`)<any[]>()
  }

  /** Checks whether the named group's membership is visible; returns false when querying fails. */
  public async isUserInGroup(groupName: string): Promise<boolean> {
    try {
      const [siteGroup] = await this.sp.web.siteGroups
        .select('CanCurrentUserViewMembership', 'Title')
        .filter(`Title eq '${groupName}'`)()
      return siteGroup && siteGroup['CanCurrentUserViewMembership']
    } catch (error) {
      return false
    }
  }

  /** Combines program benefit indicators with their benefits and measurement history. */
  public async fetchBenefitItemsWithSource(
    dataSource: DataSource,
    selectProperties: string[]
  ): Promise<any> {
    const results: any[] = await this._fetchItems(dataSource.searchQuery, [
      ...PortfolioWebPartsDataConfig.DEFAULT_GAINS_PROPERTIES,
      ...selectProperties
    ])

    const benefits = results
      .filter(
        (res) =>
          res?.ContentTypeID?.indexOf(PortfolioWebPartsDataConfig.CONTENT_TYPE_ID_BENEFITS) === 0
      )
      .map((res) => new Benefit(res))

    const measurements = results
      .filter(
        (res) =>
          res?.ContentTypeID?.indexOf(PortfolioWebPartsDataConfig.CONTENT_TYPE_ID_MEASUREMENTS) ===
          0
      )
      .map((res) => new BenefitMeasurement(res))
      .sort((a, b) => b.Date.getTime() - a.Date.getTime())

    const indicactors = results
      .filter(
        (res) =>
          res?.ContentTypeID?.indexOf(PortfolioWebPartsDataConfig.CONTENT_TYPE_ID_INDICATORS) === 0
      )
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
        ..._.pick(firstMeasurement?.Properties ?? {}, _.identity),
        ..._.pick(benefit?.Properties ?? {}, _.identity),
        Title: benefit?.Title,
        GtGainsResponsible: benefit?.Responsible,
        GtGainsOwner: benefit?.Owner,
        MeasurementIndicator: i.Title,
        GtMeasurementUnitOWSCHCS: i.Unit,
        GtStartValueOWSNMBR: i.StartValue,
        GtDesiredValueOWSNMBR: i.DesiredValue,
        LastMeasurementValue: firstMeasurement?.Value,
        MeasurementAchievement: JSON.stringify({
          Achievement: firstMeasurement?.Achievement,
          AchievementDisplay: firstMeasurement?.AchievementDisplay,
          TrendIcon: firstMeasurement?.TrendIcon
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
              Date: m.Date,
              TrendIcon: m.TrendIcon
            }
          })
        )
      }
      return item
    })

    return items
  }

  /**
   * Searches child-project content, optionally including the program site itself.
   */
  private async _fetchItems(
    queryTemplate: string,
    selectProperties: string[],
    includeSelf: boolean = false,
    siteIdManagedProperty: string = 'SiteId'
  ) {
    return searchAggregatedItems(this.sp, {
      siteIds: this.childProjects?.map((childProject) => childProject.siteId) ?? [],
      queryTemplate,
      selectProperties,
      includeSelf,
      selfSiteId: this.spfxContext.pageContext.site.id.toString(),
      siteIdManagedProperty
    })
  }

  /**
   * Loads content for a named data source, combining benefits and measurements for benefit views.
   */
  public async fetchItemsWithSource(
    dataSourceName: string,
    selectProperties: string[],
    includeSelf: boolean = false
  ): Promise<any[]> {
    let items: any[]
    if (!this.dataSourceService) {
      throw errorWithStatus(
        format(strings.DataSourceError, dataSourceName),
        this.portalDataService?.unavailableStatus
      )
    }
    const dataSrc = await this.dataSourceService.getByName(dataSourceName)
    if (!dataSrc) throw new Error(format(strings.DataSourceNotFound, dataSourceName))
    try {
      const dataSrcProperties = dataSrc.columns.map((col) => col.fieldName) || []
      if (dataSrc.category.startsWith(resource.Lists_DataSources_Category_BenefitOverview)) {
        items = await this.fetchBenefitItemsWithSource(dataSrc, [
          ...selectProperties,
          ...dataSrcProperties
        ])
      } else {
        items = await this._fetchItems(
          dataSrc.searchQuery,
          [...selectProperties, ...dataSrcProperties],
          includeSelf
        )
      }
      return items
    } catch (error) {
      // The cause keeps what SharePoint answered, for usage statistics to count the failure by.
      throw errorWithCause(format(strings.DataSourceError, dataSourceName), error)
    }
  }

  /** Reads data sources for a category and optional level, configured with the supplied columns. */
  public fetchDataSources(
    category: string,
    level?: string,
    columns?: ProjectContentColumn[]
  ): Promise<DataSource[]> {
    try {
      if (!this.dataSourceService) {
        throw errorWithStatus(
          format(strings.DataSourceCategoryError, category),
          this.portalDataService?.unavailableStatus
        )
      }
      return this.dataSourceService.getByCategory(category, level, columns)
    } catch (error) {
      throw errorWithCause(format(strings.DataSourceCategoryError, category), error)
    }
  }

  /**
   * Best-effort update of this program's project-list row in the selected or default hub.
   * Missing rows are ignored; write failures are logged without rejecting.
   *
   * @param hubSiteId Hub site ID to update the project in
   */
  public async updateProjectInHub(
    properties: Record<string, any>,
    hubSiteId?: string
  ): Promise<void> {
    try {
      const siteId = this.spfxContext.pageContext.site.id.toString()
      const web =
        hubSiteId && this._hubWebs.has(hubSiteId)
          ? this._hubWebs.get(hubSiteId)
          : this.portalDataService.web
      const list = web.lists.getByTitle(resource.Lists_Projects_Title)
      const [item] = await list.items.filter(`GtSiteId eq '${siteId}'`)()
      if (item) {
        await list.items.getById(item.ID).update(properties)
      }
    } catch (error) {
      console.warn(`Failed to update project in hub ${hubSiteId || 'default'}:`, error)
    }
  }

  /**
   * Update a child project's GtParentProjects field in its hub's Projects list.
   * Adds or removes the current program site; logs failures without rejecting.
   *
   * @param childSiteId The SiteId of the child project to update
   * @param hubSiteId The hub site ID where the child project's entry exists
   */
  private async _updateChildProjectParents(
    childSiteId: string,
    hubSiteId: string,
    operation: ParentProjectOperation,
    parentHubSiteUrl?: string
  ): Promise<void> {
    try {
      const currentSiteId = this.spfxContext.pageContext.site.id.toString()
      const currentSiteTitle = this.spfxContext.pageContext.web.title
      const currentSiteUrl = this.spfxContext.pageContext.web.absoluteUrl
      const web = this._hubWebs.get(hubSiteId) || this.portalDataService.web

      const list = web.lists.getByTitle(resource.Lists_Projects_Title)
      const [item] = await list.items
        .select('ID', 'GtParentProjects')
        .filter(`GtSiteId eq '${childSiteId}'`)()

      if (item) {
        let parentProjects: Array<Record<string, string>> = []
        try {
          parentProjects = item.GtParentProjects ? JSON.parse(item.GtParentProjects) : []
        } catch {
          parentProjects = []
        }

        switch (operation) {
          case ParentProjectOperation.Add:
            if (!parentProjects.some((p) => p.SiteId === currentSiteId)) {
              parentProjects.push({
                SiteId: currentSiteId,
                Title: currentSiteTitle,
                SPWebURL: currentSiteUrl,
                HubSiteUrl: parentHubSiteUrl
              })
            }
            break
          case ParentProjectOperation.Remove:
            parentProjects = parentProjects.filter((p) => p.SiteId !== currentSiteId)
            break
        }

        await list.items.getById(item.ID).update({
          GtParentProjects: JSON.stringify(parentProjects)
        })
      }
    } catch (error) {
      console.warn(
        `Failed to update parent projects for child ${childSiteId} in hub ${hubSiteId}:`,
        error
      )
    }
  }

  /**
   * Initialize child projects. Fetches child projects using shared-library implementation
   * and sets the `childProjects` property of the class.
   */
  public async initChildProjects(): Promise<void> {
    try {
      this.childProjects = await this.portalDataService.getChildProjects(
        this.spfxContext.pageContext.web.absoluteUrl,
        ProjectInformationChildProject
      )
    } catch (error) {
      Logger.log({
        message: `(${this._name}) (initChildProjects) Failed to initialize child projects: ${error.message}`,
        data: { error },
        level: LogLevel.Error
      })
      this.childProjects = []
    }
  }

  /**
   * Searches and joins project sites/items across the supplied hubs, caching results for five minutes.
   * At least one resolvable hub is required.
   */
  public async getHubSiteProjects(hubs: IProgramHub[]) {
    if (!hubs || hubs.length === 0) {
      throw new Error('getHubSiteProjects requires at least one hub to be provided')
    }

    const resolvedHubs = await Promise.all(
      hubs.map(async (hub) => {
        if (hub.hubSiteId && hub.title) return hub
        const resolved = await this.portalDataService.resolveHubSiteFromUrl(hub.url)
        return {
          ...hub,
          hubSiteId: hub.hubSiteId || resolved.hubSiteId,
          title: hub.title || resolved.title
        }
      })
    )

    const hubSiteIds = resolvedHubs.filter((hub) => hub.hubSiteId).map((hub) => hub.hubSiteId)

    if (hubSiteIds.length === 0) {
      throw new Error('No valid hub site IDs found in provided hubs')
    }

    const hubSiteQuery = hubSiteIds.map((id) => `DepartmentId:{${id}}`).join(' OR ')
    const cacheKey = hubSiteProjectsCacheKey(hubSiteIds)

    return new PnPClientStorage().local.getOrPut(
      cacheKey,
      async () => {
        const sitesQuery: SearchQueryInit = {
          Querytext: `(${hubSiteQuery}) contentclass:STS_Site NOT WebTemplate:TEAMCHANNEL`,
          RowLimit: 500,
          StartRow: 0,
          ClientType: 'ContentSearchRegular',
          SelectProperties: HUB_SITE_PROJECT_SITE_PROPERTIES,
          TrimDuplicates: false
        }

        const siteQueryResults = await this.sp.search(sitesQuery)
        const siteResults = [...siteQueryResults.PrimarySearchResults]

        while (siteResults.length < siteQueryResults.TotalRows) {
          const response = await this.sp.search({ ...sitesQuery, StartRow: siteResults.length })
          siteResults.push(...response.PrimarySearchResults)
        }

        const itemsQuery: SearchQueryInit = {
          Querytext: `(${hubSiteQuery}) ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C*`,
          RowLimit: 500,
          StartRow: 0,
          ClientType: 'ContentSearchRegular',
          SelectProperties: HUB_SITE_PROJECT_ITEM_PROPERTIES,
          TrimDuplicates: false
        }

        const itemQueryResults = await this.sp.search(itemsQuery)
        const itemResults = [...(itemQueryResults?.PrimarySearchResults ?? [])]

        while (itemResults.length < (itemQueryResults?.TotalRows ?? 0)) {
          const response = await this.sp.search({ ...itemsQuery, StartRow: itemResults.length })
          itemResults.push(...(response?.PrimarySearchResults ?? []))
        }

        return toHubSiteProjects(itemResults, siteResults, hubs)
      },
      dateAdd(new Date(), 'minute', 5)
    )
  }

  /**
   * Fetches current child projects. Fetches all available projects and filters out the ones that are not
   * in the child projects project property `GtChildProjects`. Also initializes the `propertyItem` property
   * of the class, so that it can be used in other methods.
   */
  public async fetchChildProjects(hubs: IProgramHub[]): Promise<any[]> {
    this._propertyItem = this._propertyList.items.getById(1)
    const [availableProjects, childProjects] = await Promise.all([
      this.getHubSiteProjects(hubs),
      this.portalDataService.getChildProjects(
        this.spfxContext.pageContext.web.absoluteUrl,
        ProjectInformationChildProject
      )
    ])
    const childProjectsSiteIds = childProjects.map((p: Record<string, any>) => p.siteId)
    return availableProjects.filter((p) => childProjectsSiteIds.indexOf(p.SiteId) !== -1)
  }

  /**
   * Stores deduplicated child-project links locally, then attempts hub and parent-link updates.
   * Requires `fetchChildProjects` to initialize the program property item first.
   *
   * @param parentHubSiteUrl The hub site URL where the parent program resides
   */
  public async addChildProjects(
    newProjects: Array<Record<string, string>>,
    parentHubSiteUrl?: string
  ) {
    if (!this._propertyItem) {
      throw new Error(
        '(SPDataAdapter) (addChildProjects) Property item not initialized. Call fetchChildProjects() first.'
      )
    }
    const { GtChildProjects } = await this._propertyItem.select('GtChildProjects')()
    let projects: Array<Record<string, string>> = []
    try {
      projects = GtChildProjects ? JSON.parse(GtChildProjects) : []
    } catch (error) {
      console.warn(
        '(SPDataAdapter) (addChildProjects) Failed to parse GtChildProjects. Resetting to empty array.',
        error
      )
      projects = []
    }
    const updatedProjects = [...projects, ...newProjects.map(toStoredChildProject)]
    const seen = new Set<string>()
    const uniqueProjects = updatedProjects.filter((project: Record<string, string>) => {
      if (seen.has(project.SiteId)) return false
      seen.add(project.SiteId)
      return true
    })
    const updateProperties = { GtChildProjects: JSON.stringify(uniqueProjects) }
    await this._propertyItem.update(updateProperties)

    const uniqueHubIds = new Set(newProjects.map((p) => p.HubSiteId).filter(Boolean))
    await Promise.all([
      ...Array.from(uniqueHubIds).map((hubSiteId) =>
        this.updateProjectInHub(updateProperties, hubSiteId as string)
      ),
      ...newProjects.map((project) =>
        project.HubSiteId
          ? this._updateChildProjectParents(
              project.SiteId,
              project.HubSiteId,
              ParentProjectOperation.Add,
              parentHubSiteUrl
            )
          : Promise.resolve()
      )
    ])
  }

  /**
   * Remove child projects: the hubs and the parent links first, the program's own list last
   * (`removeChildProjectsFromProgram`).
   *
   * @param projectToRemove Projects to delete
   */
  public async removeChildProjects(
    projectToRemove: Array<Record<string, string>>
  ): Promise<Array<Record<string, string>>> {
    if (!this._propertyItem) {
      throw new Error(
        '(SPDataAdapter) (removeChildProjects) Property item not initialized. Call fetchChildProjects() first.'
      )
    }
    return await removeChildProjectsFromProgram(
      {
        readChildProjects: async () => {
          const { GtChildProjects } = await this._propertyItem.select('GtChildProjects')()
          try {
            return GtChildProjects ? JSON.parse(GtChildProjects) : []
          } catch (error) {
            console.warn(
              '(SPDataAdapter) (removeChildProjects) Failed to parse GtChildProjects. Resetting to empty array.',
              error
            )
            return []
          }
        },
        writeChildProjects: (properties) => this._propertyItem.update(properties),
        updateHub: (properties, hubSiteId) => this.updateProjectInHub(properties, hubSiteId),
        removeParent: (siteId, hubSiteId) =>
          this._updateChildProjectParents(siteId, hubSiteId, ParentProjectOperation.Remove)
      },
      projectToRemove
    )
  }
}
