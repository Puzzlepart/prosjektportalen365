import { format } from '@fluentui/react/lib/Utilities'
import { flatten } from '@microsoft/sp-lodash-subset'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { dateAdd, stringIsNullOrEmpty } from '@pnp/common'
import { QueryPropertyValueType, SearchResult, SortDirection, sp } from '@pnp/sp'
import * as cleanDeep from 'clean-deep'
import MSGraph from 'msgraph-helper'
import {
  IAggregatedListConfiguration,
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
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-portfoliowebparts/lib/models'
import { ISPDataAdapterBaseConfiguration, SPDataAdapterBase } from 'pp365-shared/lib/data'
import { getUserPhoto } from 'pp365-shared/lib/helpers/getUserPhoto'
import { DataSource, PortfolioOverviewView, ProjectColumn } from 'pp365-shared/lib/models'
import { DataSourceService, ProjectDataService } from 'pp365-shared/lib/services'
import * as strings from 'ProgramWebPartsStrings'
import { IFetchDataForViewItemResult } from './IFetchDataForViewItemResult'
import { DEFAULT_SEARCH_SETTINGS } from './types'
import _ from 'underscore'
import {
  CONTENT_TYPE_ID_BENEFITS,
  CONTENT_TYPE_ID_INDICATORS,
  CONTENT_TYPE_ID_MEASUREMENTS,
  DEFAULT_GAINS_PROPERTIES
} from 'pp365-portfoliowebparts/lib/data/types'

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
   * Get portfolio configuration
   *
   * @description Used in `PortfolioOverview`
   */
  public async getPortfolioConfig(): Promise<IPortfolioConfiguration> {
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
      columnUrls
    }
  }

  /**
   * Get aggregated list config for the given category.
   *
   * Returns `views`, `viewsUrls`, `columnUrls` and `level`. For now
   * we only support two levels: `Portefølje` and `Prosjekt`. We need
   * to also support `Program` and `Oveordnet` in the future (as part
   * of issue #1097).
   *
   * @param category Category for data source
   * @param level Level for data source
   */
  public async getAggregatedListConfig(
    category: string,
    level: string = 'Program'
  ): Promise<IAggregatedListConfiguration> {
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
      }
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
    configuration: IPortfolioConfiguration,
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
   * @description Used in `PortfolioOverview`
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
    if (this.childProjects.length > maxProjects) {
      this.childProjects.forEach((childProject, index) => {
        queryString += `${queryProperty}:${childProject.SiteId} `
        if (queryString.length > maxQueryLength) {
          queryArray.push(queryString)
          queryString = ''
        }
        if (index === this.childProjects.length - 1) {
          queryArray.push(queryString)
        }
      })
    } else {
      this.childProjects.forEach((childProject) => {
        queryString += `${queryProperty}:${childProject.SiteId} `
      })
      queryArray.push(queryString)
    }
    return queryArray
  }

  /**
   *  do a dynamic amount of sp.search calls
   *
   * @description Used in `PortfolioOverview`
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   */
  public async fetchDataForViewBatch(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
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
   * Fetches data for portfolio views
   *
   * @description Used in `PortfolioOverview`
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
    }
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
  public async fetchProjectContentColumns(dataSourceCategory: string): Promise<any> {
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
      const list = this.portal.web.lists.getByTitle(strings.ProjectsListName)
      const [item] = await list.items
        .filter(`GtSiteId eq '${this.spfxContext.pageContext.site.id.toString()}'`)
        .get()
      await list.items.getById(item.ID).update(properties)
    } catch (error) {}
  }
}
