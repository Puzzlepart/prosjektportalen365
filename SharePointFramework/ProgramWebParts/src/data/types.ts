import { ISearchQuery, QueryPropertyValueType, SortDirection } from '@pnp/sp/search/types'

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
