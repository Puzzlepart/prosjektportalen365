import { WebPartContext } from '@microsoft/sp-webpart-base'
import { dateAdd } from '@pnp/common'
import { QueryPropertyValueType, SearchResult, SortDirection, sp, SPRest } from '@pnp/sp'
import * as cleanDeep from 'clean-deep'
import MSGraph from 'msgraph-helper'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import { IDataAdapter } from 'pp365-portfoliowebparts/lib/data/types'
import {
  IGraphGroup,
  IPortfolioConfiguration,
  ISPProjectItem,
  ISPUser
} from 'pp365-portfoliowebparts/lib/interfaces'
import {
  Benefit,
  BenefitMeasurement,
  BenefitMeasurementIndicator,
  ProjectListModel,
  TimelineContentListModel
} from 'pp365-portfoliowebparts/lib/models'
import { getUserPhoto } from 'pp365-shared/lib/helpers/getUserPhoto'
import { DataSource, PortfolioOverviewView } from 'pp365-shared/lib/models'
import { DataSourceService } from 'pp365-shared/lib/services/DataSourceService'
import { PortalDataService } from 'pp365-shared/lib/services/PortalDataService'
import * as strings from 'ProgramWebPartsStrings'
import HubSiteService, { IHubSite } from 'sp-hubsite-service'
import { IChildProject } from 'types/IChildProject'
import _, { flatten } from 'underscore'
import { GAINS_DEFAULT_SELECT_PROPERTIES } from './config'
import { IFetchDataForViewItemResult } from './IFetchDataForViewItemResult'
import { DEFAULT_SEARCH_SETTINGS } from './types'

export class DataAdapter implements IDataAdapter {
  public dataSourceService: DataSourceService
  private _portalDataService: PortalDataService
  private _sp: SPRest
  private _childProjects: IChildProject[]

  constructor(
    public context: WebPartContext,
    public hubSite: IHubSite,
    childProjects: IChildProject[]
  ) {
    this._childProjects = childProjects
    this._portalDataService = new PortalDataService().configure({
      urlOrWeb: hubSite.url
    })
    sp.setup({
      spfxContext: this.context,
      sp: { baseUrl: hubSite.url }
    })
    this._sp = sp
  }

  /**
   * Configuring the DataAdapter enabling use
   * of the DataSourceService.
   */
  public async configure(): Promise<IDataAdapter> {
    if (this.dataSourceService) return this
    const { web } = await HubSiteService.GetHubSite(this._sp, this.context.pageContext as any)
    this.dataSourceService = new DataSourceService(web)
    return this
  }

  /**
   * Get portfolio configuration
   */
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
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   */
  public async fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    siteId: string[]
  ): Promise<IFetchDataForViewItemResult[]> {
    siteId = this.context.pageContext.legacyPageContext.departmentId
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
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property
   */
  public async fetchDataForRegularView(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
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
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property
   */
  public async fetchDataForManagerView(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
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
   * @param maxQueryLength Maximum length of query before pushing to array
   * @param maxProjects Maximum projects required before creating strings
   */
  public aggregatedQueryBuilder(
    queryProperty: string,
    maxQueryLength: number = 2500,
    maxProjects: number = 25
  ): string[] {
    const queryArray = []
    let queryString = ''
    if (this._childProjects.length > maxProjects) {
      this._childProjects.forEach((childProject, index) => {
        queryString += `${queryProperty}:${childProject.SiteId} `
        if (queryString.length > maxQueryLength) {
          queryArray.push(queryString)
          queryString = ''
        }
        if (index === this._childProjects.length - 1) {
          queryArray.push(queryString)
        }
      })
    } else {
      this._childProjects.forEach((childProject) => {
        queryString += `${queryProperty}:${childProject.SiteId} `
      })
      queryArray.push(queryString)
    }
    return queryArray
  }

  /**
   *  do a dynamic amount of sp.search calls
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   */
  public async fetchDataForViewBatch(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    siteId: string[]
  ): Promise<IFetchDataForViewItemResult[]> {
    const queryArray = this.aggregatedQueryBuilder('GtSiteIdOWSTEXT')
    const items = []
    for (let i = 0; i < queryArray.length; i++) {
      const { projects, sites, statusReports } = await this._fetchDataForView(
        view,
        configuration,
        siteId,
        'GtSiteIdOWSTEXT',
        queryArray[i]
      )
      const item = sites.map((site) => {
        const [project] = projects.filter((res) => res['GtSiteIdOWSTEXT'] === site['SiteId'])
        const [statusReport] = statusReports.filter(
          (res) => res['GtSiteIdOWSTEXT'] === site['SiteId']
        )
        return {
          ...statusReport,
          ...project,
          Title: site.Title,
          Path: site.Path,
          SiteId: site['SiteId']
        }
      })
      items.push(...item)
    }
    return items
  }

  /**
   * Fetches data for portfolio views
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   * @param siteIdProperty Site ID property
   */
  private async _fetchDataForView(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
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
      this._sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: searchQuery,
        SelectProperties: [...configuration.columns.map((f) => f.fieldName), siteIdProperty]
      }),
      this._sp.search({
        ...DEFAULT_SEARCH_SETTINGS,
        QueryTemplate: `DepartmentId:{${siteId}} contentclass:STS_Site`,
        SelectProperties: ['Path', 'Title', 'SiteId']
      }),
      this._sp.search({
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
    }
  }

  /**
   *  Fetches data for the Projecttimeline project
   *
   * @param siteId - Site ID
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
    const [data] = statusReports.map((item) => cleanDeep({ ...item }))
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
      timelineFilter: config && config.GtTimelineFilter
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
      this._sp.web.lists
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

        if (
          item?.GtSiteIdLookup?.Title &&
          _.find(
            this._childProjects,
            (child) =>
              child?.SiteId === item?.GtSiteIdLookup?.GtSiteId ||
              item?.GtSiteIdLookup?.GtSiteId === this?.context?.pageContext?.site?.id?.toString()
          )
        ) {
          if (item.GtSiteIdLookup?.Title && config && config.GtShowElementProgram) {
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
              item.GtDescription,
              item.GtTag,
              item.GtBudgetTotal,
              item.GtCostsTotal
            )
            return model
          }
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
        'GtTimelineFilter'
      )
      .top(500)
      .get()
  }

  /**
   * Fetches configuration data for the Projecttimeline
   */
  public async fetchTimelineAggregatedContent(configItemTitle: string, dataSourceName: string) {
    const [timelineConfig] = await Promise.all([this.fetchTimelineConfiguration()])

    const config: any = _.find(
      timelineConfig,
      (col) => col.Title === (configItemTitle || 'Prosjektleveranse')
    )

    if (config && config.GtShowElementProgram) {
      const [projectDeliveries] = await Promise.all([
        this.configure().then((adapter) => {
          return adapter
            .fetchItemsWithSource(
              dataSourceName || 'Alle prosjektleveranser',
              [
                'Title',
                'GtDeliveryDescriptionOWSMTXT',
                'GtDeliveryStartTimeOWSDATE',
                'GtDeliveryEndTimeOWSDATE'
              ],
              true
            )
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
            (config && config.Title) || configItemTitle,
            (config && config.GtSortOrder) || 90,
            (config && config.GtHexColor) || '#384f61',
            (config && config.GtElementType) || strings.BarLabel,
            (config && config.GtShowElementPortfolio) || false,
            (config && config.GtShowElementProgram) || false,
            (config && config.GtTimelineFilter) || true,
            item.GtDeliveryStartTimeOWSDATE,
            item.GtDeliveryEndTimeOWSDATE,
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
    const response = await this._sp.search({
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
        model.userIsMember = !!group
        if (manager) model.manager = { text: manager.Title, imageUrl: getUserPhoto(manager.Email) }
        if (owner) model.owner = { text: owner.Title, imageUrl: getUserPhoto(owner.Email) }
        return model
      })
      .filter((p) => p)

    projects = projects
      .map((project) => {
        return this._childProjects.some(
          (child) =>
            child?.SiteId === project?.siteId ||
            project?.siteId === this.context.pageContext.site.id.toString()
        )
          ? project
          : undefined
      })
      .filter((p) => p)

    return projects
  }

  /**
   * Fetch enriched projects
   * Fetching project list items
   * Graph groups
   * Site users
   * Combines the data
   */
  public async fetchEnrichedProjects(): Promise<ProjectListModel[]> {
    await MSGraph.Init(this.context.msGraphClientFactory)
    const [items, groups, users] = await Promise.all([
      this._sp.web.lists
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
      this._sp.web.siteUsers
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
      const [siteGroup] = await this._sp.web.siteGroups
        .select('CanCurrentUserViewMembership', 'Title')
        .filter(`Title eq '${groupName}'`)
        .get()
      return siteGroup && siteGroup.CanCurrentUserViewMembership
    } catch (error) {
      return false
    }
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
    includeSelf: boolean = false
  ) {
    sp.setup({
      spfxContext: this.context
    })
    const siteId = this.context.pageContext.site.id.toString()
    const programFilter = this._childProjects && this.aggregatedQueryBuilder('SiteId')
    if (includeSelf) programFilter.unshift(`SiteId:${siteId}`)
    const promises = []
    programFilter.forEach((element) => {
      promises.push(
        sp.search({
          QueryTemplate: `${element} ${queryTemplate}`,
          Querytext: '*',
          RowLimit: 500,
          TrimDuplicates: false,
          SelectProperties: [...selectProperties, 'Path', 'SiteTitle']
        })
      )
    })
    const responses = await Promise.all(promises)
    return flatten(responses.map((r) => r.PrimarySearchResults))
  }

  /**
   * Post transform function for gains items
   *
   * @param results Search result items
   */
  private _postTransformGainsItems(results: any[]): any[] {
    const benefits = results
      .filter((res) => res.ContentTypeID.indexOf('0x01004F466123309D46BAB9D5C6DE89A6CF67') === 0)
      .map((res) => new Benefit(res))
    const measurements = results
      .filter((res) => res.ContentTypeID.indexOf('0x010039EAFDC2A1624C1BA1A444FC8FE85DEC') === 0)
      .map((res) => new BenefitMeasurement(res))
      .sort((a, b) => b.Date.getTime() - a.Date.getTime())

    const indicactors = results
      .filter((res) => res.ContentTypeID.indexOf('0x010073043EFE3E814A2BBEF96B8457623F95') === 0)
      .map((res) => {
        const indicator = new BenefitMeasurementIndicator(res)
          .setMeasurements(measurements)
          .setBenefit(benefits)
        return indicator
      })
      .filter((i) => i.Benefit)
    return indicactors
  }

  /**
   * Fetch items with data source name. If the data source category
   * is "Gevinstoversikt", the items are sent through the method
   * `_postTransformGainsItems`.
   *
   * @param name Data source name
   * @param selectProperties Select properties
   * @param includeSelf Include self (defaults to `false`)
   */
  public async fetchItemsWithSource(
    name: string,
    selectProperties: string[],
    includeSelf: boolean = false
  ): Promise<any> {
    const dataSrc = await this.dataSourceService.getByName(name)
    if (!dataSrc) throw new Error(format(strings.DataSourceNotFound, name))
    try {
      switch (dataSrc.category) {
        case 'Gevinstoversikt':
          {
            selectProperties.push(...GAINS_DEFAULT_SELECT_PROPERTIES)
          }
          break
      }
      let items = await this._fetchItems(dataSrc.searchQuery, selectProperties, includeSelf)
      switch (dataSrc.category) {
        case 'Gevinstoversikt':
          items = this._postTransformGainsItems(items)
          break
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
   */
  public fetchDataSources(category: string): Promise<DataSource[]> {
    try {
      return this.dataSourceService.getByCategory(category)
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
      const list = this.hubSite.web.lists.getByTitle('Prosjekter')
      const [item] = await list.items
        .filter(`GtSiteId eq '${this.context.pageContext.site.id.toString()}'`)
        .get()
      await list.items.getById(item.ID).update(properties)
    } catch (error) {}
  }
}
