import { ISearchQuery, ISearchResult, QueryPropertyValueType, SortDirection } from '@pnp/sp/search'

export const DEFAULT_SEARCH_SETTINGS: ISearchQuery = {
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

export interface IFetchDataForViewItemResult extends ISearchResult {
  SiteId: string
  [key: string]: any
}
