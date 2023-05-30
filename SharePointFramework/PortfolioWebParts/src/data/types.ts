import { TypedHash } from '@pnp/common'
import {
  ItemUpdateResult,
  QueryPropertyValueType,
  SearchQuery,
  SearchResult,
  SortDirection
} from '@pnp/sp'
import { IAggregatedListConfiguration, IPortfolioConfiguration } from 'interfaces'
import { IProjectContentColumn } from 'interfaces/IProjectContentColumn'
import { ProjectListModel, TimelineConfigurationModel, TimelineContentModel } from 'models'
import { DataSource, PortfolioOverviewView } from 'pp365-shared/lib/models'
import { DataSourceService } from 'pp365-shared/lib/services'

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

export interface IDataAdapter {
  configure(): Promise<IDataAdapter>
  dataSourceService?: DataSourceService
  fetchDataSources?(dataSourceCategory: string, level?: string): Promise<DataSource[]>
  fetchChartData?(
    currentView: any,
    configuration: any,
    chartConfigurationListName: string,
    siteId: string
  ): Promise<{ charts: any; chartData: any; contentTypes: any }>
  getPortfolioConfig?(): Promise<IPortfolioConfiguration>
  getAggregatedListConfig?(category: string): Promise<IAggregatedListConfiguration>
  fetchDataForViewBatch?(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    hubSiteId: any
  ): Promise<any>
  fetchDataForView?(
    view: PortfolioOverviewView,
    configuration: IPortfolioConfiguration,
    hubSiteId: any
  ): Promise<any>
  isUserInGroup?(groupName: string): Promise<boolean>
  fetchTimelineProjectData?(
    timelineConfig: any[]
  ): Promise<{ reports: any[]; configElement: TimelineConfigurationModel }>
  fetchTimelineContentItems?(timelineConfig: any[]): Promise<TimelineContentModel[]>
  fetchTimelineAggregatedContent?(
    configItemTitle: string,
    dataSourceName: string,
    timelineConfig: any[]
  ): Promise<TimelineContentModel[]>
  fetchTimelineConfiguration?(): Promise<TimelineConfigurationModel[]>
  fetchEnrichedProjects?(filter?: string): Promise<ProjectListModel[]>
  fetchProjects?(configuration?: IAggregatedListConfiguration, dataSource?: string): Promise<any[]>
  fetchProjectSites(
    rowLimit: number,
    sortProperty: string,
    sortDirection: SortDirection
  ): Promise<any>
  fetchItemsWithSource?(
    dataSourceName: string,
    selectProperties: string[],
    includeSelf?: boolean
  ): Promise<any[]>
  fetchBenefitItemsWithSource?(
    dataSource: DataSource,
    selectProperties: string[],
    dataSourceCategory?: string
  ): Promise<any[]>
  fetchProjectContentColumns?(dataSourceCategory: string): Promise<IProjectContentColumn[]>
  updateProjectContentColumn?(column: Record<string, any>, persistRenderAs?: boolean): Promise<any>
  deleteProjectContentColumn?(property: TypedHash<any>): Promise<any>
  addItemToList?(listName: string, properties: TypedHash<any>): Promise<any[]>
  updateDataSourceItem?(
    properties: TypedHash<any>,
    dataSourceTitle: string,
    shouldReplace?: boolean
  ): Promise<ItemUpdateResult>
}
