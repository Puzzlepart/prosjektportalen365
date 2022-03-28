import { QueryPropertyValueType, SearchQuery, SortDirection } from '@pnp/sp'
import { IPortfolioConfiguration } from 'interfaces'
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
  fetchTimelineContentItems?(): Promise<any>
  fetchEncrichedProjects?(): Promise<any>
  fetchProjectSites(arg0: number, arg1: string, Descending: SortDirection): Promise<any>
  fetchItemsWithSource?(dataSource: string, arg1: string[]): Promise<any>
}
