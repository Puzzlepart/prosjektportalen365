import { ISearchResult } from '@pnp/sp/search'

export interface IFetchDataForViewItemResult extends ISearchResult {
  SiteId: string
  [key: string]: any
}
