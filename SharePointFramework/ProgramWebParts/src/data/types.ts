import { ISearchQuery, ISearchResult, QueryPropertyValueType, SortDirection } from '@pnp/sp/search'
import { IGraphGroup, SPProjectItem } from 'pp365-shared-library'

/** Shared paged-search defaults, preserving duplicates and sorting by latest modification. */
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

/** Search-backed program overview row identified by its project site. */
export interface IFetchDataForViewItemResult extends ISearchResult {
  SiteId: string
  [key: string]: any
}

/**
 * Project-list items and group memberships combined into program project models.
 */
export interface IProjectsData {
  items: SPProjectItem[]
  memberOfGroups: IGraphGroup[]
}

/** Configured hub URL with optionally resolved SharePoint id and display title. */
export interface IProgramHub {
  url: string
  hubSiteId?: string
  title?: string
}
