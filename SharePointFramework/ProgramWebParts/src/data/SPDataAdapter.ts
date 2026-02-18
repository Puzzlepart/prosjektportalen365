import { format } from '@fluentui/react/lib/Utilities'
import { flatten } from '@microsoft/sp-lodash-subset'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { PnPClientStorage, dateAdd } from '@pnp/core'
import '@pnp/sp/items/get-all'
import {
  ISearchResult,
  QueryPropertyValueType,
  SearchQueryInit,
  SortDirection
} from '@pnp/sp/search'
import * as strings from 'ProgramWebPartsStrings'
import * as cleanDeep from 'clean-deep'
import { IProgramAdministrationProject } from 'components/ProgramAdministration/types'
import MSGraph from 'msgraph-helper'
import { IPortfolioOverviewConfiguration } from 'pp365-portfoliowebparts/lib/components'
import { IPortfolioAggregationConfiguration } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import { IPortfolioViewData, IPortfolioWebPartsDataAdapter } from 'pp365-portfoliowebparts/lib/data'
import * as PortfolioWebPartsDataConfig from 'pp365-portfoliowebparts/lib/data/config'
import {
  Benefit,
  BenefitMeasurement,
  BenefitMeasurementIndicator
} from 'pp365-portfoliowebparts/lib/models'
import {
  DataSource,
  DataSourceService,
  DefaultCaching,
  IGraphGroup,
  IProjectDataServiceParams,
  ISPDataAdapterBaseConfiguration,
  PortfolioOverviewView,
  ProjectContentColumn,
  ProjectDataService,
  ProjectInformationChildProject,
  ProjectListModel,
  SPDataAdapterBase,
  SPProjectItem,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library'
import { Logger, LogLevel } from '@pnp/logging'
import _ from 'underscore'
import { DEFAULT_SEARCH_SETTINGS, IProgramHub, IProjectsData } from './types'
import { IList } from '@pnp/sp/lists'
import { IItem } from '@pnp/sp/items'
import { PermissionKind, Web } from '@pnp/sp/presets/all'
import resource from 'SharedResources'

enum ParentProjectOperation {
  Add = 'add',
  Remove = 'remove'
}

/**
 * `SPDataAdapter` is a class that extends the `SPDataAdapterBase` class and implements the `IPortfolioWebPartsDataAdapter` interface.
 * It provides methods to configure the SP data adapter with the SPFx context and the configuration, and to get the portfolio configuration and the aggregated list configuration.
 *
 * @extends SPDataAdapterBase (from package `pp365-shared`)
 *
 * @implements IPortfolioWebPartsDataAdapter (from package `pp365-portfoliowebparts`)
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
   * Configure the SP data adapter with the SPFx context and the configuration.
   *
   * @param spfxContext SPFx WebPart context
   * @param configuration Configuration for the data adapter
   */
  public async configure(
    spfxContext: WebPartContext,
    configuration: ISPDataAdapterBaseConfiguration
  ) {
    await super.configure(spfxContext, configuration)
    this.dataSourceService = new DataSourceService(this.portalDataService.web)
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
   * Initialize hub web instances.
   *
   * @param hubs Program hubs configuration
   */
  public initializeHubWebs(hubs: IProgramHub[]): void {
    this._hubWebs.clear()
    hubs?.forEach((hub) => {
      if (hub.hubSiteId && hub.url) {
        this._hubWebs.set(hub.hubSiteId, Web([this.sp.web, hub.url]))
      }
    })
  }

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

  public async getAggregatedListConfig(
    category: string,
    level: string = resource.Lists_DataSources_Level_ParentProgram
  ): Promise<IPortfolioAggregationConfiguration> {
    try {
      const columns = await this.portalDataService.fetchProjectContentColumns(
        'PROJECT_CONTENT_COLUMNS',
        category,
        level
      )
      const [views, viewsUrls, columnUrls] = await Promise.all([
        this.fetchDataSources(category, level, columns),
        this.portalDataService.getListFormUrls('DATA_SOURCES'),
        this.portalDataService.getListFormUrls('PROJECT_CONTENT_COLUMNS')
      ])
      return {
        columns,
        views,
        viewsUrls,
        columnUrls,
        level
      } as IPortfolioAggregationConfiguration
    } catch (error) {
      return null
    }
  }

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

  public async fetchDataForRegularView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IPortfolioViewData> {
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
          Path: site?.Path,
          SPWebUrl: site?.SPWebUrl,
          SiteId: site['SiteId']
        }
      })

      return { items }
    } catch (err) {
      throw err
    }
  }

  public async fetchDataForManagerView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IPortfolioViewData> {
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
          Path: site?.Path,
          SPWebUrl: site?.SPWebUrl,
          SiteId: project[siteIdProperty]
        }
      })

      return { items }
    } catch (err) {
      throw err
    }
  }

  /**
   * Create queries if number of projects exceeds threshold to avoid 4096 character limitation by SharePoint
   *
   * @param queryProperty Dependant on whether it is aggregated portfolio or portfolio overview
   * @param maxQueryLength Maximum length of query before pushing to array (default: 2500)
   * @param maxProjects Maximum projects required before creating strings  (default: 25)
   */
  public aggregatedQueryBuilder(
    queryProperty: string,
    maxQueryLength: number = 2500,
    maxProjects: number = 25
  ): string[] {
    const aggregatedQueries = []
    let queryString = ''
    if (this.childProjects.length > maxProjects) {
      this.childProjects.forEach((childProject, index) => {
        queryString += `${queryProperty}:${childProject.siteId} `
        if (queryString.length > maxQueryLength) {
          aggregatedQueries.push(queryString)
          queryString = ''
        }
        if (index === this.childProjects.length - 1) {
          aggregatedQueries.push(queryString)
        }
      })
    } else {
      this.childProjects.forEach((childProject) => {
        queryString += `${queryProperty}:${childProject.siteId} `
      })
      aggregatedQueries.push(queryString)
    }
    return aggregatedQueries.filter(Boolean)
  }

  public async fetchDataForViewBatch(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IPortfolioViewData> {
    const queryArray = this.aggregatedQueryBuilder(siteIdProperty)
    const promises = queryArray.map(async (query) => {
      const { projects, sites, statusReports } = await this._fetchDataForView(
        view,
        configuration,
        siteId,
        siteIdProperty,
        query
      )
      return projects.map((project) => {
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
    })
    const items = await Promise.all(promises).then((results) => _.flatten(results))
    return { items, managedProperties: [] }
  }

  /**
   * Fetches data for the specified view.
   *
   * @param view View configuration
   * @param configuration Configuration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property
   */
  private async _fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
    siteIdProperty: string = 'GtSiteIdOWSTEXT',
    queryArray?: string
  ) {
    const searchQuery = `${queryArray} ${view.searchQuery}`

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
      const allResults = [...firstResponse.PrimarySearchResults]

      while (allResults.length < firstResponse.TotalRows) {
        const response = await this.sp.search({
          ...searchInit,
          StartRow: allResults.length
        })
        allResults.push(...response?.PrimarySearchResults)
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
        `${queryArray} DepartmentId:{${siteId}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:${resource.Choice_GtModerationStatus_Published}`,
        [...configuration.columns.map((f) => f.fieldName), siteIdProperty],
        configuration.refiners.map((ref) => ref.fieldName).join(',')
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
      statusReports
    } as const
  }

  /**
   * Fetches data for the Projecttimeline project.
   *
   * @param timelineConfig Timeline configuration
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
          siteId: item?.['GtSiteIdOWSTEXT'],
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
      .map((report) => ({
        siteId: report?.['GtSiteIdOWSTEXT'],
        costsTotal: report?.['GtCostsTotalOWSCURR'],
        budgetTotal: report?.['GtBudgetTotalOWSCURR']
      }))
      .filter(Boolean)

    const configElement = _.find(timelineConfig, {
      title: resource.TimelineConfiguration_Project_Title
    })

    return { data, reports, configElement, columns: configuration.refiners }
  }

  public async fetchTimelineContentItems(timelineConfig: TimelineConfigurationModel[]) {
    const [timelineItems] = await Promise.all([
      this.portalDataService.web.lists
        .getByTitle(resource.Lists_TimelineContent_Title)
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
    ])

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
   * Fetches configuration data for the `ProjectTimeline`
   *
   * @description Used in `ProjectTimeline`
   */
  public async fetchTimelineConfiguration() {
    const timelineConfig = await this.portalDataService.web.lists
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
      .getAll()

    return timelineConfig.map((item) => new TimelineConfigurationModel(item)).filter((p) => p)
  }

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
    return PrimarySearchResults.filter((site) => hubSiteId !== site['SiteId'])
  }

  /**
   * Combine the result data (items, sites, users, groups) to a list of `ProjectListModel`.@
   *
   * @param param0 Deconstructed object containing the result data
   */
  private _combineResultData({ items, memberOfGroups }: IProjectsData): ProjectListModel[] {
    let projects = items
      .map((item) => {
        const [group] = memberOfGroups.filter((grp) => grp.id === item.GtGroupId)
        const model = new ProjectListModel(group?.displayName ?? item.Title, item)
        model.isUserMember = !!group
        return model
      })
      .filter((p) => p)

    projects = projects
      .map((project) => {
        return this.childProjects.some(
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

  public async fetchEnrichedProjects(): Promise<ProjectListModel[]> {
    await MSGraph.Init(this.spfxContext.msGraphClientFactory)
    const [items, memberOfGroups] = await Promise.all([
      this.portalDataService.web.lists
        .getByTitle(resource.Lists_Projects_Title)
        .items.select(...Object.keys(new SPProjectItem()))
        .filter(
          `GtProjectLifecycleStatus ne '${resource.Choice_GtProjectLifecycleStatus_Closed}' and GtProjectLifecycleStatus ne '${strings.LifecycleStatus_Closed}'`
        )
        .orderBy('Title')
        .using(DefaultCaching)
        .getAll<SPProjectItem>(),
      MSGraph.Get<IGraphGroup[]>(
        '/me/memberOf/$/microsoft.graph.group',
        ['id', 'displayName'],
        // eslint-disable-next-line quotes
        "groupTypes/any(a:a%20eq%20'unified')"
      )
    ])
    const result: IProjectsData = {
      items,
      memberOfGroups
    }
    const projects = this._combineResultData(result)
    return projects
  }

  public async fetchProjects(
    configuration?: IPortfolioAggregationConfiguration,
    dataSource?: string
  ): Promise<any[]> {
    const odataQuery = (configuration?.views || []).find((v) => v.title === dataSource)?.odataQuery
    let projects: any[]
    if (odataQuery && !dataSource.includes(`(${strings.ProjectLevel})`)) {
      projects = await this.portalDataService.web.lists
        .getByTitle(resource.Lists_Projects_Title)
        .items.filter(`${odataQuery}`)<any[]>()
    }
    return projects
  }

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
          res.ContentTypeID.indexOf(PortfolioWebPartsDataConfig.CONTENT_TYPE_ID_BENEFITS) === 0
      )
      .map((res) => new Benefit(res))

    const measurements = results
      .filter(
        (res) =>
          res.ContentTypeID.indexOf(PortfolioWebPartsDataConfig.CONTENT_TYPE_ID_MEASUREMENTS) === 0
      )
      .map((res) => new BenefitMeasurement(res))
      .sort((a, b) => b.Date.getTime() - a.Date.getTime())

    const indicactors = results
      .filter(
        (res) =>
          res.ContentTypeID.indexOf(PortfolioWebPartsDataConfig.CONTENT_TYPE_ID_INDICATORS) === 0
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
   * Fetch items using the specified `queryTemplate` and `selectProperties`
   *
   * @param queryTemplate Query template
   * @param selectProperties Select properties
   */
  private async _fetchItems(
    queryTemplate: string,
    selectProperties: string[],
    includeSelf: boolean = false,
    siteIdManagedProperty: string = 'SiteId'
  ) {
    const siteId = this.spfxContext.pageContext.site.id.toString()
    const queries = this.childProjects && this.aggregatedQueryBuilder(siteIdManagedProperty)
    if (includeSelf) queries.unshift(`${siteIdManagedProperty}:${siteId}`)
    const promises = queries.map((q) =>
      this.sp.search({
        QueryTemplate: `${q} ${queryTemplate}`,
        Querytext: '*',
        RowLimit: 500,
        TrimDuplicates: false,
        SelectProperties: [...selectProperties, 'Path', 'Title', 'SiteTitle', 'SPWebURL']
      })
    )
    const responses = await Promise.all(promises)
    return flatten(responses.map((r) => r.PrimarySearchResults))
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
    selectProperties: string[],
    includeSelf: boolean = false
  ): Promise<any[]> {
    let items: any[]
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
      throw new Error(format(strings.DataSourceError, dataSourceName))
    }
  }

  public fetchDataSources(
    category: string,
    level?: string,
    columns?: ProjectContentColumn[]
  ): Promise<DataSource[]> {
    try {
      return this.dataSourceService.getByCategory(category, level, columns)
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, category))
    }
  }

  /**
   * Update project item/entity in hub site (portfolio)
   *
   * @param properties Properties to update
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
   * Adds or removes the current program site from the child project's parent projects array.
   *
   * @param childSiteId The SiteId of the child project to update
   * @param hubSiteId The hub site ID where the child project's entry exists
   * @param operation 'add' to add current site as parent, 'remove' to remove it
   * @param parentHubSiteUrl The hub site URL where the parent program resides
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
   * Fetches all projects associated with the current hubsite context. This is done by querying the
   * search index for all sites with the same DepartmentId as the current hubsite and all project items with
   * the same DepartmentId as the current hubsite. The sites are then matched with the items to
   * retrieve the SiteId and SPWebURL. The result are cached for 5 minutes.
   *
   * @param hubs Optional array of program hubs with their URLs and hub site IDs
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
    const cacheKey = `HubSiteProjects_${hubSiteIds.sort().join('_')}`

    return new PnPClientStorage().local.getOrPut(
      cacheKey,
      async () => {
        const sitesQuery: SearchQueryInit = {
          Querytext: `(${hubSiteQuery}) contentclass:STS_Site NOT WebTemplate:TEAMCHANNEL`,
          RowLimit: 500,
          StartRow: 0,
          ClientType: 'ContentSearchRegular',
          SelectProperties: ['SPWebURL', 'Title', 'SiteId', 'Path', 'DepartmentId'],
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
          SelectProperties: ['GtSiteIdOWSTEXT', 'Title'],
          TrimDuplicates: false
        }

        const itemQueryResults = await this.sp.search(itemsQuery)
        const itemResults = [...itemQueryResults.PrimarySearchResults]

        while (itemResults.length < itemQueryResults.TotalRows) {
          const response = await this.sp.search({ ...itemsQuery, StartRow: itemResults.length })
          itemResults.push(...response.PrimarySearchResults)
        }

        const [sts_sites, items] = await Promise.all([siteResults, itemResults])

        return items
          .filter(
            (item) =>
              item['GtSiteIdOWSTEXT'] &&
              item['GtSiteIdOWSTEXT'] !== '00000000-0000-0000-0000-000000000000'
          )
          .map<IProgramAdministrationProject>((item) => {
            const site = sts_sites.find((site) => site['SiteId'] === item['GtSiteIdOWSTEXT'])
            const rawHubSiteId = site?.['DepartmentId']
            const hubSiteId = rawHubSiteId
              ? rawHubSiteId.replace(/[{}]/g, '').toLowerCase()
              : rawHubSiteId
            const hub = hubs?.find((h) => h.hubSiteId === hubSiteId)
            return {
              SiteId: item['GtSiteIdOWSTEXT'],
              Title: site?.Title ?? item['Title'],
              SPWebURL: site?.SPWebUrl,
              Path: site?.Path,
              HubSiteId: hubSiteId,
              HubSiteUrl: hub?.url,
              HubSiteTitle: hub?.title,
              _site: site
            }
          })
          .filter((project) => project._site)
          .map(({ _site, ...project }) => project)
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
    const childProjectsSiteIds = childProjects.map((p: Record<string, any>) => p.SiteId)
    return availableProjects.filter((p) => childProjectsSiteIds.indexOf(p.SiteId) !== -1)
  }

  /**
   * Add child projects.
   *
   * @param newProjects New projects to add
   * @param parentHubSiteUrl The hub site URL where the parent program resides
   */
  public async addChildProjects(
    newProjects: Array<Record<string, string>>,
    parentHubSiteUrl?: string
  ) {
    const { GtChildProjects } = await this._propertyItem.select('GtChildProjects')()
    const projects = JSON.parse(GtChildProjects)
    const updatedProjects = [...projects, ...newProjects]
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
   * Remove child projects.
   *
   * @param projectToRemove Projects to delete
   */
  public async removeChildProjects(
    projectToRemove: Array<Record<string, string>>
  ): Promise<Array<Record<string, string>>> {
    const { GtChildProjects } = await this._propertyItem.select('GtChildProjects')()
    const projects: Array<Record<string, string>> = JSON.parse(GtChildProjects)
    const updatedProjects = projects.filter(
      (p) => !projectToRemove.some((el) => el.SiteId === p.SiteId)
    )
    const updateProperties = { GtChildProjects: JSON.stringify(updatedProjects) }
    await this._propertyItem.update(updateProperties)

    const uniqueHubIds = new Set(projectToRemove.map((p) => p.HubSiteId).filter(Boolean))
    await Promise.all([
      ...Array.from(uniqueHubIds).map((hubSiteId) =>
        this.updateProjectInHub(updateProperties, hubSiteId as string)
      ),
      ...projectToRemove.map((project) =>
        project.HubSiteId
          ? this._updateChildProjectParents(
              project.SiteId,
              project.HubSiteId,
              ParentProjectOperation.Remove
            )
          : Promise.resolve()
      )
    ])

    return updatedProjects
  }
}
