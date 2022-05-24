import { TypedHash } from '@pnp/common'
import { QueryPropertyValueType, SearchQuery, SortDirection } from '@pnp/sp'
import { IPortfolioConfiguration, IAggregatedListConfiguration } from 'interfaces'
import { ProjectListModel, TimelineContentListModel } from 'models'
import { DataSource, PortfolioOverviewView } from 'pp365-shared/lib/models'
import { DataSourceService } from 'pp365-shared/lib/services'

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

export interface IDataAdapter {
  configure(): Promise<IDataAdapter>
  dataSourceService?: DataSourceService
  fetchDataSources?(dataSourceCategory: string): Promise<DataSource[]>
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
  isUserInGroup?(PortfolioManagerGroupName: string): Promise<boolean>
  fetchDataForTimelineProject?(siteId: any): Promise<any>
  fetchTimelineContentItems?(): Promise<TimelineContentListModel[]>
  fetchTimelineAggregatedContent?(configItemTitle: string, dataSourceName: string): Promise<TimelineContentListModel[]>
  fetchTimelineConfiguration?(): Promise<any>
  fetchEnrichedProjects?(): Promise<ProjectListModel[]>
  fetchProjects?(dataSourceName: string): Promise<any[]>
  fetchProjectSites(rowLimit: number, sortProperty: string, sortDirection: SortDirection): Promise<any>
  fetchItemsWithSource?(dataSourceName: string, selectProperties: string[]): Promise<any[]>
  addItemToList?(listName: string, properties: TypedHash<any>): Promise<any[]>
  updateDataSourceItem?(properties: TypedHash<any>, itemTitle?: string): Promise<any[]>
}
