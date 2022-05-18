import { QueryPropertyValueType, SearchQuery, SortDirection } from '@pnp/sp'
import { IPortfolioConfiguration } from 'interfaces'
import { ProjectListModel, TimelineContentListModel } from 'models'
import { DataSource, PortfolioOverviewView } from 'pp365-shared/lib/models'

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
  fetchDataSources?(dataSourceCategory: string): Promise<DataSource[]>
  fetchChartData?(
    currentView: any,
    configuration: any,
    chartConfigurationListName: string,
    arg3: string
  ): Promise<{ charts: any; chartData: any; contentTypes: any }>
  getPortfolioConfig?(): Promise<IPortfolioConfiguration>
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
  fetchItemsWithSource?(dataSourceName: string, arg1: string[]): Promise<any[]>
}
