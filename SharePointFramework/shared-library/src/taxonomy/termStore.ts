import { combine, isUrlAbsolute } from '@pnp/core'
import { parseBinderWithErrorCheck } from '@pnp/queryable'
import {
  extractWebUrl,
  ISPCollection,
  ISPInstance,
  ISPQueryable,
  SPCollection,
  SPFI,
  SPInit,
  SPInstance,
  SPQueryable
} from '@pnp/sp'
import {
  collectPages,
  DEFAULT_TERM_PAGE_SIZE,
  IPagedResult,
  MAX_TERM_PAGES,
  parsePagedResponse,
  readResultLimit,
  resolvePagedQuery
} from './paging'
import {
  joinSegments,
  TERM_SETS_PATH,
  TERM_STORE_API_PATH,
  TERMS_PATH,
  termSegments,
  termSetSegments
} from './paths'
import { ITermInfo, ITermSetInfo, ITermStoreInfo } from './types'

/**
 * A minimal, read only client for the SharePoint term store REST surface
 * (`_api/v2.1/termstore`), replacing the `@pnp/sp/taxonomy` module that PnPjs
 * dropped in v4.
 *
 * Two things rule out the v4 alternatives. `@pnp/graph`'s taxonomy targets the
 * Microsoft Graph term store on the beta endpoint and has no `localProperties`,
 * which Prosjektportalen depends on for phase metadata. And the module is composed
 * rather than subclassed from PnPjs' queryables: the SPFx rig compiles this package
 * to ES5, and an ES5 `__extends` of PnPjs' native ES2015 classes throws
 * "Class constructor cannot be invoked without 'new'" at runtime.
 *
 * Writes are deliberately not ported. Taxonomy provisioning in Prosjektportalen runs
 * over JSOM, which uses a different auth path than this REST surface.
 */

/** The term store root. */
export interface ITermStore extends ISPInstance<ITermStoreInfo> {
  /** The term sets in this store. */
  readonly sets: ITermSets
}

/** A collection of term sets. */
export interface ITermSets extends ISPCollection<ITermSetInfo[]> {
  /**
   * Addresses a single term set by ID.
   *
   * @param termSetId Term set GUID, with or without braces
   */
  getById(termSetId: string): ITermSet
}

/** A single term set. */
export interface ITermSet extends ISPInstance<ITermSetInfo> {
  /** The terms in this set. */
  readonly terms: ITerms
}

/** A collection of terms. */
export interface ITerms extends ISPCollection<ITermInfo[]> {
  /**
   * Addresses a single term by ID.
   *
   * @param termId Term GUID, with or without braces
   */
  getById(termId: string): ITerm

  /**
   * Gets every term in the collection, following `nextLink` across pages.
   *
   * Invoking the collection directly returns only the first page, which is what
   * `@pnp/sp@3` did. Prefer this for term sets that are not known to be small.
   *
   * A `$top` the caller set is reused as the page size *and* honoured as a result
   * count, so `terms.top(50).all()` returns at most 50 terms rather than every term
   * in the set. `skip()` is not supported and throws, see `UNSUPPORTED_QUERY_PARAMS`.
   *
   * @param pageSize Value for `$top`, ignored when the caller already set one
   */
  all(pageSize?: number): Promise<ITermInfo[]>
}

/** A single term. */
export interface ITerm extends ISPInstance<ITermInfo> {}

/**
 * Gets the term store for a configured PnPjs instance.
 *
 * This replaces the `sp.termStore` property that `@pnp/sp@3` added by augmenting the
 * `SPFI` type. The augmentation made the term store reachable without an import,
 * which in turn made every call site invisible to a search for the module, so it is
 * not reproduced here.
 *
 * Prefer `getTermStore(sp.web)`. `sp.web` is a plain queryable, so its URL and its
 * observers are both reachable through public API; an `SPFI` keeps its configured
 * root in a protected field, and this falls back to its `web` for that reason.
 *
 * @param base A configured queryable whose observers and web URL should be reused
 * (`sp.web`), or the `SPFI` itself
 */
export function getTermStore(base: SPFI | ISPQueryable): ITermStore {
  const source = resolveSource(base)
  if (!source || typeof source.toUrl !== 'function') {
    throw new Error(
      'Cannot resolve the term store: pass a configured queryable, for example getTermStore(sp.web).'
    )
  }
  const sourceUrl = source.toUrl()
  // Inside SPFx, `spfi().using(SPFx(context))` keeps every URL relative ("_api/web") and the SPFx
  // behaviour prefixes the current web's URL at request time. A relative source therefore gets a
  // relative term store URL, resolved by the same behaviour. An absolute source (`spfi(hubUrl)`)
  // pins the term store to that web, so the term store of another site can be read explicitly.
  const webUrl = isUrlAbsolute(sourceUrl) ? extractWebUrl(sourceUrl) : ''
  const termStoreUrl = webUrl ? combine(webUrl, TERM_STORE_API_PATH) : TERM_STORE_API_PATH
  // The [parent, url] form reuses the source's observers (auth, caching, fetch) with this URL.
  return TermStore(SPQueryable([source, termStoreUrl]))
}

/**
 * Creates a term store queryable. Prefer `getTermStore`.
 */
export function TermStore(base: SPInit, path?: string): ITermStore {
  const termStore = SPInstance(base, path) as unknown as ITermStore
  defineChild(termStore, 'sets', () => TermSets(termStore))
  return termStore
}

/**
 * Creates a term set collection queryable.
 *
 * @param base The term store the sets belong to
 */
export function TermSets(base: SPInit): ITermSets {
  const sets = SPCollection(base, TERM_SETS_PATH) as unknown as ITermSets
  sets.getById = (termSetId: string) => TermSet(base, joinSegments(termSetSegments(termSetId)))
  return sets
}

/**
 * Creates a term set queryable.
 */
export function TermSet(base: SPInit, path?: string): ITermSet {
  const termSet = SPInstance(base, path) as unknown as ITermSet
  defineChild(termSet, 'terms', () => Terms(termSet))
  return termSet
}

/**
 * Creates a term collection queryable.
 *
 * @param base The term set the terms belong to
 */
export function Terms(base: SPInit): ITerms {
  const terms = SPCollection(base, TERMS_PATH) as unknown as ITerms
  terms.getById = (termId: string) => Term(base, joinSegments(termSegments(termId)))
  terms.all = (pageSize: number = DEFAULT_TERM_PAGE_SIZE) => getAllTerms(terms, pageSize)
  return terms
}

/**
 * Creates a term queryable.
 */
export function Term(base: SPInit, path?: string): ITerm {
  return SPInstance(base, path) as unknown as ITerm
}

/**
 * Resolves the queryable whose URL and observers the term store is built from.
 *
 * An `SPFI` is not a queryable, so its public `web` stands in for it. Both are public
 * API, unlike the protected root an `SPFI` is constructed with: reading that would
 * turn a rename inside PnPjs into an opaque "No observers registered for this
 * request" at runtime rather than a compile error.
 */
function resolveSource(base: SPFI | ISPQueryable): ISPQueryable {
  const web = (base as unknown as { web?: ISPQueryable })?.web
  return web ?? (base as ISPQueryable)
}

/**
 * Defines a lazily created child queryable, mirroring how PnPjs exposes `sets`,
 * `terms` and friends as getters rather than as eagerly built instances.
 */
function defineChild<T>(target: unknown, name: string, factory: () => T): void {
  Object.defineProperty(target, name, {
    configurable: true,
    enumerable: true,
    get: factory
  })
}

/**
 * Enumerates every term in a collection, following `nextLink`.
 *
 * `async` so that an unsupported query parameter rejects the promise `all()` already
 * returns, rather than throwing synchronously out of an otherwise awaited call.
 */
async function getAllTerms(terms: ITerms, pageSize: number): Promise<ITermInfo[]> {
  const limit = readResultLimit(terms.query)
  const firstPage = createPagedQueryable(terms, pageSize)
  return await collectPages<ITermInfo>(
    (nextLink) => {
      const page = nextLink ? SPCollection([firstPage, nextLink]) : firstPage
      return page() as Promise<IPagedResult<ITermInfo>>
    },
    MAX_TERM_PAGES,
    limit
  )
}

/**
 * Clones a term collection into a queryable that resolves to the raw page (values
 * plus `nextLink`) instead of just the values, and that always carries a `$top`.
 *
 * Pages after the first are chained from this queryable so that they inherit both
 * the parser and the behaviors, exactly as PnPjs does for list item paging.
 */
function createPagedQueryable(terms: ITerms, pageSize: number): ISPCollection<any> {
  const paged = SPCollection(terms).using(
    parseBinderWithErrorCheck((response: Response) => parsePagedResponse<ITermInfo>(response))
  )
  resolvePagedQuery(terms.query, paged.query, pageSize)
  return paged
}
