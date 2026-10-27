import { IFetchDataForViewItemResult, IPortfolioViewData, PortfolioInstance } from './types'

/**
 * The hub a merged view's row came from, kept on the row: the hub column shows `_hubTitle`, and
 * the dedupe tells rows of two hubs apart by `_hubId`.
 */
export interface IHubMetadata {
  _hubId: string
  _hubTitle: string
  _hubUrl: string
}

/**
 * The hub a portfolio's rows carry.
 *
 * @param portfolio The portfolio
 */
export function hubMetadata(portfolio: PortfolioInstance): IHubMetadata {
  return { _hubId: portfolio.uniqueId, _hubTitle: portfolio.title, _hubUrl: portfolio.url }
}

/**
 * A view's search query scoped to another hub: every `DepartmentId:{…}` in it is that hub's. A
 * query without one is left as it is; the sites and the status reports a view reads are scoped
 * to the hub by `fetchDataForView` itself, so the rows are that hub's either way.
 *
 * @param searchQuery The view's search query
 * @param hubSiteId The hub's site id
 */
export function replaceDepartmentId(searchQuery: string, hubSiteId: string): string {
  return searchQuery.replace(/DepartmentId:\{[a-f0-9-]+\}/gi, `DepartmentId:{${hubSiteId}}`)
}

/**
 * The rows of one portfolio, for the merge.
 */
export interface IPortfolioViewResult {
  portfolio: PortfolioInstance
  data: IPortfolioViewData
}

/**
 * The rows of several portfolios as one view: each row with its hub, the managed properties of
 * them all, and no row twice. A row is the same row as another when it has the same site, the same
 * report series (`ScopeKey`) and the same hub; the same project read from two hubs is two rows.
 *
 * @param results Each portfolio's rows, the primary first
 */
export function mergePortfolioViewData(results: IPortfolioViewResult[]): IPortfolioViewData {
  const managedProperties: string[] = []
  const seen = new Set<string>()
  const items: IFetchDataForViewItemResult[] = []
  for (const { portfolio, data } of results) {
    for (const property of data.managedProperties ?? []) {
      if (!managedProperties.includes(property)) managedProperties.push(property)
    }
    for (const item of data.items) {
      const row = { ...item, ...hubMetadata(portfolio) }
      const key = `${row.SiteId}_${row.ScopeKey ?? ''}_${row._hubId}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push(row)
    }
  }
  return { items, managedProperties }
}

/**
 * The merged view's rows: the primary portfolio's, then each other portfolio's that is included,
 * read one by one. A portfolio that cannot be read is left out and named in `failedPortfolios`,
 * so the view can say so (WCAG 3.3.1); the primary's failure is the view's. Nothing is read when
 * no portfolio is included.
 *
 * @param portfolios The portfolios configured, the primary first
 * @param fetchPrimary Reads the primary portfolio's rows
 * @param fetchOther Reads another portfolio's rows, against its hub
 * @param onError Told of each portfolio that could not be read
 */
export async function fetchMergedViewData(
  portfolios: PortfolioInstance[],
  fetchPrimary: (portfolio: PortfolioInstance) => Promise<IPortfolioViewData>,
  fetchOther: (portfolio: PortfolioInstance) => Promise<IPortfolioViewData>,
  onError?: (portfolio: PortfolioInstance, error: Error) => void
): Promise<IPortfolioViewData> {
  const included = (portfolios ?? []).filter((p) => p.includeInMergedView !== false)
  if (included.length === 0) return { items: [], managedProperties: [], failedPortfolios: [] }
  const [primary, ...others] = included
  const results: IPortfolioViewResult[] = [
    { portfolio: primary, data: await fetchPrimary(primary) }
  ]
  const failedPortfolios: PortfolioInstance[] = []
  for (const portfolio of others) {
    try {
      results.push({ portfolio, data: await fetchOther(portfolio) })
    } catch (error) {
      failedPortfolios.push(portfolio)
      onError?.(portfolio, error)
    }
  }
  return { ...mergePortfolioViewData(results), failedPortfolios }
}
