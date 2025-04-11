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
  ProjectListModel,
  SPDataAdapterBase,
  SPProjectItem,
  TimelineConfigurationModel,
  TimelineContentModel,
  getUserPhoto
} from 'pp365-shared-library'
import _ from 'underscore'
import { DEFAULT_SEARCH_SETTINGS, IProjectsData } from './types'
import { IList } from '@pnp/sp/lists'
import { IItem } from '@pnp/sp/items'
import { PermissionKind } from '@pnp/sp/presets/all'
import resx from 'ResxStrings'

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
  implements IPortfolioWebPartsDataAdapter {
  public project: ProjectDataService
  public dataSourceService: DataSourceService
  public childProjects: Array<Record<string, string>>
  private _propertyList: IList
  private _propertyItem: IItem

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
      propertiesListName: resx.Lists_ProjectProperties_Title
    } as IProjectDataServiceParams)
    this._propertyList = this.sp.web.lists.getByTitle('Prosjektegenskaper')
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
      hubSiteId: this.spfxContext.pageContext.legacyPageContext.hubSiteId,
    } as IPortfolioOverviewConfiguration
  }

  public async getAggregatedListConfig(
    category: string,
    level: string = 'Overordnet/Program'
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
        queryString += `${queryProperty}:${childProject.SiteId} `
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
        queryString += `${queryProperty}:${childProject.SiteId} `
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
    let [
      { PrimarySearchResults: projects },
      { PrimarySearchResults: sites },
      { PrimarySearchResults: statusReports }
    ] = await Promise.all([
      this.sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: searchQuery,
        SelectProperties: [...configuration.columns.map((f) => f.fieldName), siteIdProperty]
      }),
      this.sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: `DepartmentId:{${siteId}} contentclass:STS_Site`,
        SelectProperties: ['Path', 'SPWebUrl', 'Title', 'SiteId']
      }),
      this.sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: `${queryArray} DepartmentId:{${siteId}} ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:Publisert`,
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

    const searchQuery =
      'ContentTypeId:0x010022252E35737A413FB56A1BA53862F6D5* GtModerationStatusOWSCHCS:Publisert'
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

    const configElement = _.find(timelineConfig, { title: strings.ProjectLabel })

    return { data, reports, configElement, columns: configuration.refiners }
  }

  public async fetchTimelineContentItems(timelineConfig: TimelineConfigurationModel[]) {
    const [timelineItems] = await Promise.all([
      this.portalDataService.web.lists
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
    ])

    return timelineItems
      .map((item) => {
        const type = item.GtTimelineTypeLookup && item.GtTimelineTypeLookup.Title
        const config = timelineConfig.find((col) => col.title === type)

        if (
          item?.GtSiteIdLookup?.GtSiteId &&
          this.childProjects.find(
            (child) =>
              child?.SiteId === item?.GtSiteIdLookup?.GtSiteId ||
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
      .getByTitle(strings.TimelineConfigurationListName)
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
      (col) => col.title === (configItemTitle || 'Prosjektleveranse')
    )

    if (config?.showElementProgram) {
      const projectDeliveries = await this.fetchItemsWithSource(
        dataSourceName || 'Alle prosjektleveranser',
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
            timelineCategory: 'Styring',
            elementType: strings.BarLabel,
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
  private _combineResultData({ items, memberOfGroups, users }: IProjectsData): ProjectListModel[] {
    let projects = items
      .map((item) => {
        const [group] = memberOfGroups.filter((grp) => grp.id === item.GtGroupId)
        const [owner] = users.filter((user) => user.Id === item.GtProjectOwnerId)
        const [manager] = users.filter((user) => user.Id === item.GtProjectManagerId)
        const model = new ProjectListModel(group?.displayName ?? item.Title, item)
        model.isUserMember = !!group
        if (manager)
          model.manager = { name: manager.Title, image: { src: getUserPhoto(manager.Email) } }
        if (owner) model.owner = { name: owner.Title, image: { src: getUserPhoto(owner.Email) } }
        return model
      })
      .filter((p) => p)

    projects = projects
      .map((project) => {
        return this.childProjects.some(
          (child) =>
            child?.SiteId === project?.siteId ||
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
    const [items, memberOfGroups, users] = await Promise.all([
      this.portalDataService.web.lists
        .getByTitle(strings.ProjectsListName)
        .items.select(...Object.keys(new SPProjectItem()))
        // eslint-disable-next-line quotes
        .filter("GtProjectLifecycleStatus ne 'Avsluttet' and GtProjectLifecycleStatus ne 'Stengt'")
        .orderBy('Title')
        .using(DefaultCaching)
        .getAll<SPProjectItem>(),
      MSGraph.Get<IGraphGroup[]>(
        '/me/memberOf/$/microsoft.graph.group',
        ['id', 'displayName'],
        // eslint-disable-next-line quotes
        "groupTypes/any(a:a%20eq%20'unified')"
      ),
      this.sp.web.siteUsers.select('Id', 'Title', 'Email').using(DefaultCaching)()
    ])
    const result: IProjectsData = {
      items,
      memberOfGroups,
      users
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
    if (odataQuery && !dataSource.includes('(Prosjektnivå)')) {
      projects = await this.portalDataService.web.lists
        .getByTitle(strings.ProjectsListName)
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
      if (dataSrc.category.startsWith('Gevinstoversikt')) {
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
   */
  public async updateProjectInHub(properties: Record<string, any>): Promise<void> {
    try {
      const siteId = this.spfxContext.pageContext.site.id.toString()
      const list = this.portalDataService.web.lists.getByTitle(strings.ProjectsListName)
      const [item] = await list.items.filter(`GtSiteId eq '${siteId}'`)()
      await list.items.getById(item.ID).update(properties)
    } catch (error) { }
  }

  /**
   * Fetches child projects from the Prosjektegenskaper list item. The note field `GtChildProjects`
   * contains a JSON string with the child projects, and needs to be parsed. If the retrieve
   * fails, an empty array is returned.
   *
   * @returns An array of child projects, each represented as a record with `SiteId` and `Title` properties.
   */
  public async getChildProjects(): Promise<Array<Record<string, string>>> {
    try {
      const projectProperties = await this._propertyItem.select('GtChildProjects')()
      try {
        const childProjects = JSON.parse(projectProperties.GtChildProjects)
        return !_.isEmpty(childProjects) ? childProjects : []
      } catch {
        return []
      }
    } catch {
      return []
    }
  }

  /**
   * Initialize child projects. Runs `getChildProjects` and sets the `childProjects` property
   * of the class.
   */
  public async initChildProjects(): Promise<void> {
    try {
      this._propertyItem = this._propertyList.items.getById(1)
      this.childProjects = await this.getChildProjects()
    } catch (error) { }
  }

  /**
   * Fetches all projects associated with the current hubsite context. This is done by querying the
   * search index for all sites with the same DepartmentId as the current hubsite and all project items with
   * the same DepartmentId as the current hubsite. The sites are then matched with the items to
   * retrieve the SiteId and SPWebURL. The result are cached for 5 minutes.
   */
  public async getHubSiteProjects() {
    const { HubSiteId } = await this.sp.site.select('HubSiteId')()
    return new PnPClientStorage().local.getOrPut(
      `HubSiteProjects_${HubSiteId}`,
      async () => {
        const sitesQuery: SearchQueryInit = {
          Querytext: `DepartmentId:{${HubSiteId}} contentclass:STS_Site NOT WebTemplate:TEAMCHANNEL`,
          RowLimit: 500,
          StartRow: 0,
          ClientType: 'ContentSearchRegular',
          SelectProperties: ['SPWebURL', 'Title', 'SiteId', 'Path'],
          TrimDuplicates: false
        }

        const siteQueryResults = await this.sp.search(sitesQuery)
        const siteResults = [...siteQueryResults.PrimarySearchResults]

        while (siteResults.length < siteQueryResults.TotalRows) {
          const response = await this.sp.search({ ...sitesQuery, StartRow: siteResults.length })
          siteResults.push(...response.PrimarySearchResults)
        }

        const itemsQuery: SearchQueryInit = {
          Querytext: `DepartmentId:{${HubSiteId}} ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C*`,
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
            return {
              SiteId: item['GtSiteIdOWSTEXT'],
              Title: site?.Title ?? item['Title'],
              SPWebURL: site?.SPWebUrl,
              Path: site?.Path
            }
          })
      },
      dateAdd(new Date(), 'minute', 5)
    )
  }

  /**
   * Get child project site IDs from the Prosjektegenskaper list item. The note field `GtChildProjects`
   * contains a JSON string with the child projects, and needs to be parsed. If the retrieve
   * fails, an empty array is returned.
   */
  public async getChildProjectIds(): Promise<string[]> {
    try {
      const projectProperties = await this._propertyItem.select('GtChildProjects')()
      try {
        const childProjects = JSON.parse(projectProperties.GtChildProjects)
        return childProjects.map((p: Record<string, any>) => p.SiteId)
      } catch {
        return []
      }
    } catch (error) {
      return []
    }
  }

  /**
   * Fetches current child projects. Fetches all available projects and filters out the ones that are not
   * in the child projects project property `GtChildProjects`. Also initializes the `propertyItem` property
   * of the class, so that it can be used in other methods.
   */
  public async fetchChildProjects(): Promise<any[]> {
    this._propertyItem = this._propertyList.items.getById(1)
    const [availableProjects, childProjects] = await Promise.all([
      this.getHubSiteProjects(),
      this.getChildProjects()
    ])
    const childProjectsSiteIds = childProjects.map((p: Record<string, any>) => p.SiteId)
    return availableProjects.filter((p) => childProjectsSiteIds.indexOf(p.SiteId) !== -1)
  }

  /**
   * Add child projects.
   *
   * @param newProjects New projects to add
   */
  public async addChildProjects(newProjects: Array<Record<string, string>>) {
    const { GtChildProjects } = await this._propertyItem.select('GtChildProjects')()
    const projects = JSON.parse(GtChildProjects)
    const updatedProjects = [...projects, ...newProjects]
    const updateProperties = { GtChildProjects: JSON.stringify(updatedProjects) }
    await this._propertyItem.update(updateProperties)
    await this.updateProjectInHub(updateProperties)
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
    await this.updateProjectInHub(updateProperties)
    return updatedProjects
  }
}
