import { ISearchResult } from '@pnp/sp/search/types'

export interface IFetchDataForViewItemResult extends ISearchResult {
  SiteId: string
  [key: string]: any
}
