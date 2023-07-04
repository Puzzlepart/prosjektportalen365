import {
  ItemUpdateResult,
  QueryPropertyValueType,
  SearchQuery,
  SearchResult,
  SortDirection
} from '@pnp/sp'
import { IProjectContentColumn } from 'pp365-shared-library'
import {
  DataSource,
  PortfolioOverviewView,
  ProjectListModel,
  SPProjectColumnItem,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library/lib/models'
import { DataSourceService } from 'pp365-shared-library/lib/services'
import { IPortfolioAggregationConfiguration, IPortfolioOverviewConfiguration } from '../components'
import { WebPartContext } from '@microsoft/sp-webpart-base'

export interface IFetchDataForViewItemResult extends SearchResult {
  SiteId: string
  [key: string]: any
}

export const DEFAULT_SEARCH_SETTINGS: SearchQuery = {
  Querytext: '*',
  RowLimit: 500,
  TrimDuplicates: false,
  Properties: [
    {
      Name: 'EnableDynamicGroups',
      Value: {
        BoolVal: true,
        QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
      }
    }
  ],
  SortList: [{ Property: 'LastModifiedTime', Direction: SortDirection.Descending }]
}

export const CONTENT_TYPE_ID_BENEFITS = '0x01004F466123309D46BAB9D5C6DE89A6CF67'
export const CONTENT_TYPE_ID_MEASUREMENTS = '0x010039EAFDC2A1624C1BA1A444FC8FE85DEC'
export const CONTENT_TYPE_ID_INDICATORS = '0x010073043EFE3E814A2BBEF96B8457623F95'
export const DEFAULT_GAINS_PROPERTIES = [
  'Path',
  'SPWebURL',
  'Title',
  'ListItemId',
  'SiteTitle',
  'SiteId',
  'ContentTypeID',
  'GtDesiredValueOWSNMBR',
  'GtMeasureIndicatorOWSTEXT',
  'GtMeasurementUnitOWSCHCS',
  'GtStartValueOWSNMBR',
  'GtMeasurementValueOWSNMBR',
  'GtMeasurementCommentOWSMTXT',
  'GtMeasurementDateOWSDATE',
  'GtGainsResponsibleOWSUSER',
  'GtGainsTurnoverOWSMTXT',
  'GtGainsTypeOWSCHCS',
  'GtPrereqProfitAchievementOWSMTXT',
  'GtRealizationTimeOWSDATE',
  'GtGainLookupId',
  'GtMeasureIndicatorLookupId',
  'GtGainsResponsible',
  'GtGainsOwner'
]

export interface IPortfolioWebPartsDataAdapter {
  /**
   * Configure data adapter - returns an configured instance of the data adapter.
   *
   * @param spfxContext SPFx context
   * @param configuration Configuration for data adapter
   */
  configure(
    spfxContext?: WebPartContext,
    configuration?: any
  ): Promise<IPortfolioWebPartsDataAdapter | void>

  /**
   * An instance of the data source service.
   */
  dataSourceService?: DataSourceService

  /**
   * Fetch data sources by category and optional level.
   *
   * @param category Data source category
   * @param level Level for data source
   */
  fetchDataSources?(dataSourceCategory: string, level?: string): Promise<DataSource[]>

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
   * Returns `views`, `viewsUrls`, `columnUrls` and `level`. For now
   * we only support two levels: `Portefølje` and `Prosjekt`. We need
   * to also support `Program` and `Oveordnet` in the future (as part
   * of issue #1097).
   *
   * @param category Category for data source
   * @param level Level for data source
   */
  getAggregatedListConfig?(category: string): Promise<IPortfolioAggregationConfiguration>

  /**
   * Do a dynamic amount of `sp.search` calls based on the amount of projects
   * to avoid 4096 character limitation by SharePoint. Uses `this.aggregatedQueryBuilder`
   * to create queries.
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   */
  fetchDataForViewBatch?(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    hubSiteId: any
  ): Promise<any>

  /**
   * Fetch data for view
   *
   * @param view View configuration
   * @param configuration PortfolioOverviewConfiguration
   * @param siteId Site ID
   */
  fetchDataForView?(
    view: PortfolioOverviewView,
    configuration: IPortfolioOverviewConfiguration,
    hubSiteId: any
  ): Promise<any>

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
   * for 30 minutes.
   *
   * @param filter Filter for project items (defaults to 'GtProjectLifecycleStatus ne 'Avsluttet')
   */
  fetchEnrichedProjects?(filter?: string): Promise<ProjectListModel[]>

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
    sortProperty: string,
    sortDirection: SortDirection
  ): Promise<any>

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
   * Fetch project content columns from the project content columns SharePoint list on the hub site
   * with the specified `dataSourceCategory` or without a category. The result is transformed into
   * `ProjectColumn` objects. The `renderAs` property is set to the `dataType` property in lower case
   * and with spaces replaced with underscores.
   *
   * If the `dataSourceCategory` is null or empty, an empty array is returned.
   *
   * @param category Category for data source
   */
  fetchProjectContentColumns?(dataSourceCategory: string): Promise<IProjectContentColumn[]>

  /**
   * Update project content column with new values for properties `GtColMinWidth` and `GtColMaxWidth`,
   * aswell as the `GtFieldDataType` property if parameter `persistRenderAs` is true.
   *
   * @param column Project content column
   * @param persistRenderAs Persist render as property
   */
  updateProjectContentColumn?(column: Record<string, any>, persistRenderAs?: boolean): Promise<any>

  /**
   * Delete project content column
   *
   * @param column Column to delete
   */
  deleteProjectContentColumn?(property: Record<string, any>): Promise<any>

  /**
   * Add item to a list
   *
   * @param listName List name
   * @param properties Properties
   */
  addItemToList?<T>(listName: string, properties: Record<string, any>): Promise<T>

  /**
   * Update item in a list
   *
   * @param listName List name
   * @param itemId Item ID
   * @param properties Properties
   */
  updateItemInList?<T>(
    listName: string,
    itemId: number,
    properties: Record<string, any>
  ): Promise<T>

  /**
   * Deletes the item with the specified ID from the specified list.
   *
   * @param listName List name
   * @param itemId Item ID
   */
  deleteItemFromList?(listName: string, itemId: number): Promise<boolean>

  /**
   * Adds a new column to the project columns list and adds the column to the specified view.
   *
   * @param properties Properties for the new column
   * @param view The view to add the column to
   */
  addColumnToPortfolioView?(
    properties: SPProjectColumnItem,
    view: PortfolioOverviewView
  ): Promise<boolean>

  /**
   * Update the data source item with title `dataSourceTitle` with the properties in `properties`.
   *
   * @param properties Properties
   * @param dataSourceTitle Data source title
   */
  updateDataSourceItem?(
    properties: Record<string, any>,
    dataSourceTitle: string,
    shouldReplace?: boolean
  ): Promise<ItemUpdateResult>
}
