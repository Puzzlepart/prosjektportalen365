import { SearchResult } from '@pnp/sp'

export interface IFetchDataForViewItemResult extends SearchResult {
  SiteId: string
  [key: string]: any
}
