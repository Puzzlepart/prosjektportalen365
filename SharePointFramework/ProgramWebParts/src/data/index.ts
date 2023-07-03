import { format } from '@fluentui/react/lib/Utilities'
import { flatten } from '@microsoft/sp-lodash-subset'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { PnPClientStorage, dateAdd, stringIsNullOrEmpty } from '@pnp/common'
import { QueryPropertyValueType, SearchResult, SortDirection, sp } from '@pnp/sp'
import * as strings from 'ProgramWebPartsStrings'
import * as cleanDeep from 'clean-deep'
import { IProgramAdministrationProject } from 'components/ProgramAdministration/types'
import MSGraph from 'msgraph-helper'
import { IPortfolioOverviewConfiguration } from 'pp365-portfoliowebparts/lib/components'
import { IPortfolioAggregationConfiguration } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import {
  CONTENT_TYPE_ID_BENEFITS,
  CONTENT_TYPE_ID_INDICATORS,
  CONTENT_TYPE_ID_MEASUREMENTS,
  DEFAULT_GAINS_PROPERTIES
} from 'pp365-portfoliowebparts/lib/data/types'
import {
  Benefit,
  BenefitMeasurement,
  BenefitMeasurementIndicator
} from 'pp365-portfoliowebparts/lib/models'
import {
  DataSource,
  DataSourceService,
  IGraphGroup,
  IProjectContentColumn,
  ISPDataAdapterBaseConfiguration,
  ISPProjectItem,
  ISPUser,
  PortfolioOverviewView,
  ProjectColumn,
  ProjectDataService,
  ProjectListModel,
  SPDataAdapterBase,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library'
import { getUserPhoto } from 'pp365-shared-library/lib/helpers/getUserPhoto'
import _ from 'underscore'
import { DEFAULT_SEARCH_SETTINGS, IFetchDataForViewItemResult } from './types'

/**
 * SPDataAdapter for `ProgramWebParts`.
 *
 * @extends SPDataAdapterBase (from package `pp365-shared`)
 */
export class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterBaseConfiguration> {
  public project: ProjectDataService
  public dataSourceService: DataSourceService
  public childProjects: Array<Record<string, string>>

  /**
   * Configure the SP data adapter
   *
   * @param spfxContext Context
   * @param configuration Configuration
   */
  public async configure(
    spfxContext: WebPartContext,
    configuration: ISPDataAdapterBaseConfiguration
  ) {
    await super.configure(spfxContext, configuration)
    this.dataSourceService = new DataSourceService(this.portal.web)
    this.project = new ProjectDataService(
      {
        ...this.settings,
        entityService: this.entityService,
        propertiesListName: strings.ProjectPropertiesListName
      },
      this.spConfiguration
    )
  }

  /**
   * Get PortfolioOverview configuration for the `PortfolioOverview` component.
   *
   * Used by the `ProgramProjectOverview` web part.
   *
   * @returns `columns`, `refiners`, `views`, `viewsUrls`, `columnUrls`, `programs` and `userCanAddViews`.
   */
  public async getPortfolioConfig(): Promise<IPortfolioOverviewConfiguration> {
    // eslint-disable-next-line prefer-const
    let [columnConfig, columns, views, viewsUrls, columnUrls] = await Promise.all([
      this.portal.getProjectColumnConfig(),
      this.portal.getProjectColumns(),
      this.portal.getPortfolioOverviewViews(),
      this.portal.getListFormUrls('PORTFOLIO_VIEWS'),
      this.portal.getListFormUrls('PROJECT_COLUMNS')
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
      userCanAddViews: false
    } as IPortfolioOverviewConfiguration
  }

  /**
   * Get PortfolioAggregation configuration for the `PortfolioAggregation` component.
   *
   * @param category Category for data source
   * @param level Level for data source (defaults to `Overordnet/Program`)
   *
   * @returns `views`, `viewsUrls`, `columnUrls` and `level`.
   */
  public async getAggregatedListConfig(
    category: string,
    level: string = 'Overordnet/Program'
  ): Promise<IPortfolioAggregationConfiguration> {
    try {
      const [views, viewsUrls, columnUrls] = await Promise.all([
        this.fetchDataSources(category, level),
        this.portal.getListFormUrls('DATA_SOURCES'),
        this.portal.getListFormUrls('PROJECT_CONTENT_COLUMNS')
      ])
      return {
        views,
        viewsUrls,
        columnUrls,
        level
      } as IPortfolioAggregationConfiguration
    } catch (error) {
      return null
    }
  }

  /**
   * Fetch data for view
   *
   * @description Used in `PortfolioOverview`
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   */
  public async fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[]
  ): Promise<IFetchDataForViewItemResult[]> {
    siteId = this.spfxContext.pageContext.legacyPageContext.departmentId
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
   * @description Used in `PortfolioOverview`
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property
   */
  public async fetchDataForRegularView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
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
   * @description Used in `PortfolioOverview`
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property
   */
  public async fetchDataForManagerView(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
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

  /**
   * Do a dynamic amount of `sp.search` calls based on the amount of projects
   * to avoid 4096 character limitation by SharePoint. Uses `this.aggregatedQueryBuilder`
   * to create queries.
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   */
  public async fetchDataForViewBatch(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    siteId: string[],
    siteIdProperty: string = 'GtSiteIdOWSTEXT'
  ): Promise<IFetchDataForViewItemResult[]> {
    const queryArray = this.aggregatedQueryBuilder(siteIdProperty)
    const items = []
    for (let i = 0; i < queryArray.length; i++) {
      const { projects, sites, statusReports } = await this._fetchDataForView(
        view,
        configuration,
        siteId,
        siteIdProperty,
        queryArray[i]
      )
      const item = projects.map((project) => {
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
      items.push(...item)
    }
    return items
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
      sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: searchQuery,
        SelectProperties: [...configuration.columns.map((f) => f.fieldName), siteIdProperty]
      }),
      sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: `DepartmentId:{${siteId}} contentclass:STS_Site`,
        SelectProperties: ['Path', 'Title', 'SiteId']
      }),
      sp.search({
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
      .map((report) => {
        return {
          siteId: report && report['GtSiteIdOWSTEXT'],
          costsTotal: report && report['GtCostsTotalOWSCURR'],
          budgetTotal: report && report['GtBudgetTotalOWSCURR']
        }
      })
      .filter((p) => p)

    const configElement = _.find(timelineConfig, (col) => col.title === strings.ProjectLabel)

    return { reports, configElement }
  }

  /**
   *  Fetches items from timeline content list
   *
   * * Fetching list items
   * * Maps the items to `TimelineContentModel`
   *
   * @description Used in `ProjectTimeline`
   */
  public async fetchTimelineContentItems(timelineConfig: TimelineConfigurationModel[]) {
    const [timelineItems] = await Promise.all([
      this.portal.web.lists
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
          item?.GtSiteIdLookup?.Title &&
          this.childProjects.find(
            (child) =>
              child?.SiteId === item?.GtSiteIdLookup?.GtSiteId ||
              item?.GtSiteIdLookup?.GtSiteId ===
                this?.spfxContext?.pageContext?.site?.id?.toString()
          )
        ) {
          if (item.GtSiteIdLookup?.Title && config && config.showElementPortfolio) {
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
    const timelineConfig = await this.portal.web.lists
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

  /**
   * Fetches configuration data for the `ProjectTimeline`
   *
   * @description Used in `ProjectTimeline`
   */
  public async fetchTimelineAggregatedContent(
    configItemTitle: string,
    dataSourceName: string,
    timelineConfig: TimelineConfigurationModel[]
  ) {
    const config = timelineConfig.find(
      (col) => col.title === (configItemTitle || 'Prosjektleveranse')
    )

    if (config && config.showElementPortfolio) {
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
      Querytext: `DepartmentId:{${this.spfxContext.pageContext.legacyPageContext.hubSiteId}} contentclass:STS_Site`,
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
      (site) => this.spfxContext.pageContext.legacyPageContext.hubSiteId !== site['SiteId']
    )
  }

  /**
   * Map projects
   *
   * @param items Items
   * @param groups Groups
   * @param users Users
   */
  private _mapProjects(
    items: ISPProjectItem[],
    groups: IGraphGroup[],
    users: ISPUser[]
  ): ProjectListModel[] {
    let projects = items
      .map((item) => {
        const [group] = groups.filter((grp) => grp.id === item.GtGroupId)
        const [owner] = users.filter((user) => user.Id === item.GtProjectOwnerId)
        const [manager] = users.filter((user) => user.Id === item.GtProjectManagerId)
        const model = new ProjectListModel(group?.displayName ?? item.Title, item)
        model.isUserMember = !!group
        if (manager) model.manager = { text: manager.Title, imageUrl: getUserPhoto(manager.Email) }
        if (owner) model.owner = { text: owner.Title, imageUrl: getUserPhoto(owner.Email) }
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

  /**
   * Fetch enriched projects
   *
   * Fetching the following:
   * - Project list items
   * - Graph groups
   * - Site users
   *
   * Then combines/joins the data
   */
  public async fetchEnrichedProjects(): Promise<ProjectListModel[]> {
    await MSGraph.Init(this.spfxContext.msGraphClientFactory)
    const [items, groups, users] = await Promise.all([
      this.portal.web.lists
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
          'Title'
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
   * Fetch benefit items with the specified `dataSource` and `selectProperties`. The result
   * is transformed into `Benefit`, `BenefitMeasurement` and `BenefitMeasurementIndicator` objects
   * which is the main difference from `_fetchItems`.
   *
   * @param dataSource Data source
   * @param selectProperties Select properties
   */
  public async fetchBenefitItemsWithSource(
    dataSource: DataSource,
    selectProperties: string[]
  ): Promise<any> {
    const results: any[] = await this._fetchItems(dataSource.searchQuery, [
      ...DEFAULT_GAINS_PROPERTIES,
      ...selectProperties
    ])

    const benefits = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_BENEFITS) === 0)
      .map((res) => new Benefit(res))

    const measurements = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_MEASUREMENTS) === 0)
      .map((res) => new BenefitMeasurement(res))
      .sort((a, b) => b.Date.getTime() - a.Date.getTime())

    const indicactors = results
      .filter((res) => res.ContentTypeID.indexOf(CONTENT_TYPE_ID_INDICATORS) === 0)
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
    sp.setup({
      spfxContext: this.spfxContext
    })
    const siteId = this.spfxContext.pageContext.site.id.toString()
    const programFilter = this.childProjects && this.aggregatedQueryBuilder(siteIdManagedProperty)
    if (includeSelf) programFilter.unshift(`${siteIdManagedProperty}:${siteId}`)
    const promises = []
    programFilter.forEach((element) => {
      promises.push(
        sp.search({
          QueryTemplate: `${element} ${queryTemplate}`,
          Querytext: '*',
          RowLimit: 500,
          TrimDuplicates: false,
          SelectProperties: [...selectProperties, 'Path', 'Title', 'SiteTitle', 'SPWebURL']
        })
      )
    })
    const responses = await Promise.all(promises)
    return flatten(responses.map((r) => r.PrimarySearchResults))
  }

  /**
   * Fetch items with data source name.
   *
   * @param name Data source name
   * @param selectProperties Select properties
   * @param includeSelf Include self (defaults to `false`)
   */
  public async fetchItemsWithSource(
    name: string,
    selectProperties: string[],
    includeSelf: boolean = false
  ): Promise<any[]> {
    let items: any[]
    const dataSrc = await this.dataSourceService.getByName(name)
    if (!dataSrc) throw new Error(format(strings.DataSourceNotFound, name))
    try {
      const dataSrcProperties = dataSrc.projectColumns.map((col) => col.fieldName) || []
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
      throw new Error(format(strings.DataSourceError, name))
    }
  }

  /**
   * Fetch data sources by category
   *
   * @param category Data source category
   * @param level Level for data source
   */
  public fetchDataSources(category: string, level?: string): Promise<DataSource[]> {
    try {
      return this.dataSourceService.getByCategory(category, level)
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, category))
    }
  }

  /**
   * Fetch items from the project content columns SharePoint list on the hub site.
   *
   * @param category Category for data source
   */
  public async fetchProjectContentColumns(
    dataSourceCategory: string
  ): Promise<IProjectContentColumn[]> {
    try {
      if (stringIsNullOrEmpty(dataSourceCategory)) return []
      const projectContentColumnsList = this.portal.web.lists.getByTitle(
        strings.ProjectContentColumnsListName
      )
      const projectContentColumnsListItems = await projectContentColumnsList.items.get()
      const filteredItems = projectContentColumnsListItems
        .filter(
          (item) => item.GtDataSourceCategory === dataSourceCategory || !item.GtDataSourceCategory
        )
        .map((item) => {
          const projectColumn = new ProjectColumn(item)
          const renderAs = (projectColumn.dataType ? projectColumn.dataType.toLowerCase() : 'text')
            .split(' ')
            .join('_')
          projectColumn['data'] = { renderAs }
          return projectColumn
        })
      return filteredItems
    } catch (error) {
      throw new Error(format(strings.DataSourceCategoryError, dataSourceCategory))
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
      const list = this.portal.web.lists.getByTitle(strings.ProjectsListName)
      const [item] = await list.items.filter(`GtSiteId eq '${siteId}'`).get()
      await list.items.getById(item.ID).update(properties)
    } catch (error) {}
  }

  /**
   * Get child projects from the Prosjektegenskaper list item. The note field `GtChildProjects`
   * contains a JSON string with the child projects, and needs to be parsed. If the retrieve
   * fails, an empty array is returned.
   *
   * @returns {Promise<Array<Record<string, string>>>} Child projects
   */
  public async getChildProjects(): Promise<Array<Record<string, string>>> {
    try {
      const projectProperties = await sp.web.lists
        .getByTitle('Prosjektegenskaper')
        .items.getById(1)
        .usingCaching()
        .get()
      try {
        const childProjects = JSON.parse(projectProperties.GtChildProjects)
        return !_.isEmpty(childProjects) ? childProjects : []
      } catch {
        return []
      }
    } catch (error) {
      return []
    }
  }

  /**
   * Initialize child projects. Runs `getChildProjects` and sets the `childProjects` property
   * of the class.
   */
  public async initChildProjects(): Promise<void> {
    try {
      this.childProjects = await this.getChildProjects()
    } catch (error) {}
  }

  /**
   * Fetches all projects associated with the current hubsite context. This is done by querying the
   * search index for all sites with the same DepartmentId as the current hubsite and all project items with
   * the same DepartmentId as the current hubsite. The sites are then matched with the items to
   * retrieve the SiteId and SPWebURL. The result are cached for 5 minutes.
   */
  public async getHubSiteProjects() {
    const { HubSiteId } = await sp.site.select('HubSiteId').usingCaching().get()
    return new PnPClientStorage().local.getOrPut(
      `HubSiteProjects_${HubSiteId}`,
      async () => {
        const [{ PrimarySearchResults: sts_sites }, { PrimarySearchResults: items }] =
          await Promise.all([
            sp.search({
              Querytext: `DepartmentId:{${HubSiteId}} contentclass:STS_Site NOT WebTemplate:TEAMCHANNEL`,
              RowLimit: 500,
              StartRow: 0,
              ClientType: 'ContentSearchRegular',
              SelectProperties: ['SPWebURL', 'Title', 'SiteId'],
              TrimDuplicates: false
            }),
            sp.search({
              Querytext: `DepartmentId:{${HubSiteId}} ContentTypeId:0x0100805E9E4FEAAB4F0EABAB2600D30DB70C*`,
              RowLimit: 500,
              StartRow: 0,
              ClientType: 'ContentSearchRegular',
              SelectProperties: ['GtSiteIdOWSTEXT', 'Title'],
              TrimDuplicates: false
            })
          ])
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
              SPWebURL: site && site['SPWebURL']
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
      const projectProperties = await sp.web.lists
        .getByTitle('Prosjektegenskaper')
        .items.getById(1)
        .usingCaching()
        .get()
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
   * in the child projects project property `GtChildProjects`.
   */
  public async fetchChildProjects(): Promise<any[]> {
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
    const [{ GtChildProjects }] = await sp.web.lists
      .getByTitle('Prosjektegenskaper')
      .items.select('GtChildProjects')
      .get()
    const projects = JSON.parse(GtChildProjects)
    const updatedProjects = [...projects, ...newProjects]
    const updateProperties = { GtChildProjects: JSON.stringify(updatedProjects) }
    await sp.web.lists.getByTitle('Prosjektegenskaper').items.getById(1).update(updateProperties)
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
    const [currentData] = await sp.web.lists
      .getByTitle('Prosjektegenskaper')
      .items.select('GtChildProjects')
      .get()
    const projects: Array<Record<string, string>> = JSON.parse(currentData.GtChildProjects)
    const updatedProjects = projects.filter(
      (p) => !projectToRemove.some((el) => el.SiteId === p.SiteId)
    )
    const updateProperties = { GtChildProjects: JSON.stringify(updatedProjects) }
    await sp.web.lists.getByTitle('Prosjektegenskaper').items.getById(1).update(updateProperties)
    await this.updateProjectInHub(updateProperties)
    return updatedProjects
  }
}
