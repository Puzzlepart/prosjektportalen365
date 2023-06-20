import {
  QueryPropertyValueType,
  SortDirection,
  SearchQuery,
  SearchResult
} from '@pnp/sp'

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
  SortList: [
    { Property: 'LastModifiedTime', Direction: SortDirection.Descending }
  ]
}

export interface IFetchDataForViewItemResult extends SearchResult {
  SiteId: string
  [key: string]: any
}
