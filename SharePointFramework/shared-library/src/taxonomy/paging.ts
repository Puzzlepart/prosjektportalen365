/**
 * OData paging for the SharePoint term store REST surface.
 *
 * PnPjs v3 never followed `nextLink` for taxonomy, so a term set with more terms than
 * the server page size silently returned a truncated list. v4 removed the
 * `items/get-all` helper in favour of async iteration, but its iterator sets no
 * default `$top`, so the page size drops to the server default unless one is set.
 * Both problems are handled here, in a module free of `@pnp/*` imports so it can be
 * unit tested under the CommonJS Jest runner.
 */

/**
 * Default `$top` used when enumerating terms. The term store caps `$top`, and 500 is
 * both accepted and large enough that realistic term sets come back in one request.
 */
export const DEFAULT_TERM_PAGE_SIZE = 500

/**
 * Upper bound on the number of pages followed for a single enumeration. Reaching it
 * means the server is not advancing the cursor, and failing loudly beats spinning.
 */
export const MAX_TERM_PAGES = 200

/**
 * Query parameters that have to be carried over onto the paging request. Everything
 * else is either irrelevant or already encoded into `nextLink`.
 */
export const PAGED_QUERY_PARAMS = ['$select', '$expand', '$filter', '$orderby', '$top']

/**
 * Query parameters that `ISPCollection` can set but that paging cannot honour.
 *
 * `skip()` is the concrete case: it compiles against the term collection, but `$skip`
 * is neither carried onto the first page nor encoded into `nextLink`, so enumerating
 * would silently start at offset 0. Failing loudly beats returning the wrong terms.
 */
export const UNSUPPORTED_QUERY_PARAMS = ['$skip']

/**
 * The annotation carrying the link to the next page. The term store answers with the
 * OData v4 form, but SharePoint REST surfaces in minimal metadata mode use the
 * unprefixed form, so both are accepted.
 */
const NEXT_LINK_KEYS = ['@odata.nextLink', 'odata.nextLink']

/**
 * One page of an OData collection.
 */
export interface IPagedResult<T> {
  value: T[]
  nextLink?: string
}

/**
 * The part of `URLSearchParams` that PnPjs exposes as `Queryable.query`.
 *
 * Declaring the seam structurally rather than importing PnPjs is what lets the query
 * handling be unit tested: a plain object with these two methods is a complete stand
 * in for a live queryable's parameters.
 */
export interface IQueryParams {
  // `null` mirrors URLSearchParams, which is the API this seam stands in for
  // eslint-disable-next-line @rushstack/no-new-null
  get(name: string): string | null
  set(name: string, value: string): void
}

/**
 * The part of `Response` the page parser touches, declared structurally so the parser
 * can be exercised without a live `fetch`.
 */
export interface IPageResponse {
  status: number
  headers: {
    has(name: string): boolean
    // `null` mirrors Headers, which is the API this seam stands in for
    // eslint-disable-next-line @rushstack/no-new-null
    get(name: string): string | null
  }
  text(): Promise<string>
}

/**
 * Reads the link to the next page out of a raw OData response body.
 *
 * @returns The next link, or `undefined` when this was the last page
 */
export function readNextLink(json: unknown): string | undefined {
  if (!json || typeof json !== 'object') return undefined
  for (const key of NEXT_LINK_KEYS) {
    const value = (json as Record<string, unknown>)[key]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return undefined
}

/**
 * Parses one page of a term store collection response.
 *
 * Mirrors the empty body handling of PnPjs' `DefaultParse`, which every other request
 * in this module goes through: a `Content-Length: 0` header, a `204` and a whitespace
 * only body are all answered with an empty page rather than a `SyntaxError` out of
 * `JSON.parse`. The term store returns exactly that for a term set with no terms.
 *
 * @param response Fetch response for the page
 * @returns The page values plus the link to the next page, if any
 */
export async function parsePagedResponse<T>(response: IPageResponse): Promise<IPagedResult<T>> {
  const contentLength = response?.headers?.has('Content-Length')
    ? response.headers.get('Content-Length')
    : undefined
  if (parseFloat(contentLength) === 0 || response?.status === 204) return { value: [] }
  const text = await response.text()
  if (!text || text.replace(/\s/gi, '').length === 0) return { value: [] }
  const json = JSON.parse(text)
  return { value: readODataValue<T>(json), nextLink: readNextLink(json) }
}

/**
 * Reads the values out of an OData collection body. The term store always answers
 * with the `value` envelope, so anything else is treated as an empty page.
 */
function readODataValue<T>(json: unknown): T[] {
  const value = (json as { value?: T[] })?.value
  return Array.isArray(value) ? value : []
}

/**
 * Follows `nextLink` until the collection is exhausted and returns the concatenated
 * result.
 *
 * @param fetchPage Fetches one page. Called with `undefined` for the first page and
 * with the previous page's `nextLink` for every page after that.
 * @param maxPages Safety valve, see `MAX_TERM_PAGES`
 * @param limit Stops once this many items have been collected, and truncates to it.
 * Used to honour a `$top` the caller set as a result count rather than a page size.
 */
export async function collectPages<T>(
  fetchPage: (nextLink?: string) => Promise<IPagedResult<T>>,
  maxPages: number = MAX_TERM_PAGES,
  limit?: number
): Promise<T[]> {
  const results: T[] = []
  const seenLinks: string[] = []
  let nextLink: string
  let pages = 0

  do {
    if (pages >= maxPages) {
      throw new Error(
        `Term store paging exceeded ${maxPages} pages, aborting to avoid an endless request loop.`
      )
    }
    const page = await fetchPage(nextLink)
    pages++
    const value = page?.value
    if (value) {
      for (let i = 0; i < value.length; i++) results.push(value[i])
    }
    if (limit > 0 && results.length >= limit) return results.slice(0, limit)
    nextLink = page?.nextLink
    if (nextLink) {
      if (seenLinks.indexOf(nextLink) !== -1) {
        throw new Error(
          'Term store returned a repeated nextLink, aborting to avoid an endless request loop.'
        )
      }
      seenLinks.push(nextLink)
    }
  } while (nextLink)

  return results
}

/**
 * Copies the query parameters of the collection being enumerated onto the queryable
 * that will actually be paged, and makes sure a `$top` is set.
 *
 * The `$top` is the point of this: without it the term store falls back to its own
 * page size, which turns one request into many and, before `collectPages` existed,
 * silently truncated the result. A `$top` the caller set explicitly always wins.
 *
 * Both arguments are the `{ get, set }` shape PnPjs exposes as `Queryable.query`, so
 * this is the same code path in production and under test.
 *
 * @param source Parameters currently set on the collection being enumerated
 * @param target Parameters of the queryable used for the paging requests
 * @param pageSize Value used for `$top` when the caller did not set one
 * @returns `target`, for chaining
 * @throws When the collection carries a parameter paging cannot honour, see
 * `UNSUPPORTED_QUERY_PARAMS`
 */
export function resolvePagedQuery<T extends IQueryParams>(
  source: IQueryParams,
  target: T,
  pageSize: number = DEFAULT_TERM_PAGE_SIZE
): T {
  for (const param of UNSUPPORTED_QUERY_PARAMS) {
    if (!isEmptyParam(source?.get(param))) {
      throw new Error(
        `Term store paging does not support '${param}'. Remove it, or read the collection directly instead of enumerating every page.`
      )
    }
  }
  let top: string
  for (const param of PAGED_QUERY_PARAMS) {
    const value = source?.get(param)
    if (isEmptyParam(value)) continue
    target.set(param, value)
    if (param === '$top') top = value
  }
  if (isEmptyParam(top)) target.set('$top', String(pageSize))
  return target
}

/**
 * Reads the number of results the caller asked for with `$top`.
 *
 * `all()` reuses `$top` as the page size, so without this cap a caller who wrote
 * `terms.top(50)` would get every term in the set rather than 50.
 *
 * @returns The requested result count, or `undefined` when the caller set no `$top`
 */
export function readResultLimit(query: IQueryParams): number | undefined {
  const value = query?.get('$top')
  if (isEmptyParam(value)) return undefined
  const limit = parseInt(value, 10)
  return isNaN(limit) || limit <= 0 ? undefined : limit
}

/**
 * A query parameter counts as unset when it is absent or empty. `URLSearchParams.get`
 * answers `null` for absent, a fake or a plain record may answer `undefined`.
 */
function isEmptyParam(value: string): boolean {
  return value === null || value === undefined || value === ''
}
