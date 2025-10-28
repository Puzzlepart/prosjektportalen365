import { ISearchQuery, ISearchResult, QueryPropertyValueType, SortDirection } from '@pnp/sp/search'
import { IGraphGroup, SPProjectItem } from 'pp365-shared-library'

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

/**
 * Project data fetched in `fetchEnrichedProjects` method, and
 * used as parameter in the `_combineResultData` method.
 */
export interface IProjectsData {
  items: SPProjectItem[]
  memberOfGroups: IGraphGroup[]
}
