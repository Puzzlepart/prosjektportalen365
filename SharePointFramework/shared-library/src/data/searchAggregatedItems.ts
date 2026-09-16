import { SPFI } from '@pnp/sp'
import '@pnp/sp/search'
import { buildAggregatedSiteIdQueries } from '../util/buildAggregatedSiteIdQueries'

export interface ISearchAggregatedItemsOptions {
  /**
   * Site IDs to aggregate items from (typically child projects)
   */
  siteIds: string[]

  /**
   * Query template to append to the site ID query fragments
   * (typically the search query of a data source)
   */
  queryTemplate: string

  /**
   * Select properties. `Path`, `Title`, `SiteTitle` and `SPWebURL` are always included.
   */
  selectProperties?: string[]

  /**
   * Whether to include the current site in the aggregation (requires `selfSiteId`)
   */
  includeSelf?: boolean

  /**
   * Site ID of the current site. Required when `includeSelf` is `true`.
   */
  selfSiteId?: string

  /**
   * Managed property to query site IDs with (default: `SiteId`)
   */
  siteIdManagedProperty?: string

  /**
   * Row limit per search request (default: `500`)
   */
  rowLimit?: number
}

/**
 * Fans out one search request per site ID chunk (see `buildAggregatedSiteIdQueries`)
 * and returns the flattened primary search results. Returns an empty array when
 * there are no queries to run.
 *
 * @param sp SPFI instance to search with
 * @param options Options for the aggregated search
 */
export async function searchAggregatedItems(
  sp: SPFI,
  options: ISearchAggregatedItemsOptions
): Promise<Record<string, any>[]> {
  const {
    siteIds,
    queryTemplate,
    selectProperties = [],
    includeSelf = false,
    selfSiteId,
    siteIdManagedProperty = 'SiteId',
    rowLimit = 500
  } = options
  const queries = buildAggregatedSiteIdQueries(siteIds, siteIdManagedProperty)
  if (includeSelf && selfSiteId) queries.unshift(`${siteIdManagedProperty}:${selfSiteId}`)
  if (queries.length === 0) return []
  const results = await Promise.all(
    queries.map(async (q) => {
      // Search caps each response at `rowLimit`, so page with `StartRow`
      // until `TotalRows` is reached — a chunk can match more than one page.
      const items: Record<string, any>[] = []
      let startRow = 0

      while (true) {
        const response = await sp.search({
          QueryTemplate: `${q} ${queryTemplate}`,
          Querytext: '*',
          RowLimit: rowLimit,
          StartRow: startRow,
          TrimDuplicates: false,
          SelectProperties: [...selectProperties, 'Path', 'Title', 'SiteTitle', 'SPWebURL']
        })
        const pageItems = response?.PrimarySearchResults ?? []
        items.push(...pageItems)
        startRow += pageItems.length
        if (pageItems.length === 0 || startRow >= (response?.TotalRows ?? 0)) break
      }
      return items
    })
  )
  return results.flat()
}
