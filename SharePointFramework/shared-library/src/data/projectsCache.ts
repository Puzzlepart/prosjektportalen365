/**
 * Tiered cache for the raw datasets behind `fetchEnrichedProjects` and
 * `fetchProjects`. The cache is split per source (items, sites, memberOf, users)
 * so that lightweight callers (ProjectTimeline, PortfolioAggregation) can share
 * the `items` cache with the heavier `fetchEnrichedProjects` caller (ProjectList)
 * without pulling in `sites`/`memberOf`/`users` they don't need.
 *
 * Tiering:
 * - **L1 — in-memory singleton.** Module-scoped `Map`. Shared across webparts
 *   mounted on the same page. Zero serialization, zero main-thread blocking.
 * - **L2 — sessionStorage.** Optional, size-guarded per entry. Used only for
 *   small datasets (`sites`, `memberOf`, `users`). The `items` dataset is **not**
 *   persisted to sessionStorage because it can grow large (1000+ projects ×
 *   several KB each) and risks quota exhaustion.
 *
 * In-flight deduplication ensures that two webparts calling the same source
 * concurrently share one Promise.
 */

export type ProjectsCacheSource =
  | 'items'
  | 'sites'
  | 'memberOf'
  | 'users'
  | 'templates'
  | 'refiners'

const DEFAULT_TTL_MINUTES = 30
const SESSION_SIZE_LIMIT_BYTES = 1_000_000 // 1 MB per entry
const SESSION_STORAGE_PREFIX = 'pp365_projects_'

/**
 * Sources that are persisted to sessionStorage. `items` and `templates` are
 * kept L1-only to avoid quota pressure in large tenants.
 */
const L2_PERSISTED_SOURCES: ReadonlySet<ProjectsCacheSource> = new Set<ProjectsCacheSource>([
  'sites',
  'memberOf',
  'users'
])

type CacheEntry<T> = { data: T; expiresAt: number }

const memory = new Map<string, CacheEntry<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

/**
 * Build a canonical cache key for a given source + site.
 */
function buildKey(source: ProjectsCacheSource, siteId: string): string {
  return `${SESSION_STORAGE_PREFIX}${source}_${siteId}`
}

/**
 * Read from L1. Returns `undefined` on miss or expiry.
 */
function readL1<T>(key: string): T | undefined {
  const entry = memory.get(key) as CacheEntry<T> | undefined
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    memory.delete(key)
    return undefined
  }
  return entry.data
}

/**
 * Read from L2 (sessionStorage). Returns `undefined` on miss, expiry, parse
 * failure, or when running outside a browser.
 */
function readL2<T>(key: string): T | undefined {
  if (typeof sessionStorage === 'undefined') return undefined
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (!parsed || typeof parsed.expiresAt !== 'number') return undefined
    if (parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(key)
      return undefined
    }
    return parsed.data
  } catch {
    return undefined
  }
}

/**
 * Write to L1 always. Write to L2 only for persisted sources and when the
 * serialized size is below the limit. Failures are swallowed — caching is
 * best-effort.
 */
function writeCache<T>(
  source: ProjectsCacheSource,
  key: string,
  data: T,
  ttlMinutes: number
): void {
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000
  memory.set(key, { data, expiresAt })

  if (!L2_PERSISTED_SOURCES.has(source)) return
  if (typeof sessionStorage === 'undefined') return

  try {
    const serialized = JSON.stringify({ data, expiresAt } as CacheEntry<T>)
    if (serialized.length > SESSION_SIZE_LIMIT_BYTES) return
    sessionStorage.setItem(key, serialized)
  } catch {
    // Quota exceeded or other storage error — leave L1 populated and move on.
  }
}

/**
 * Get a cached value or populate it by calling `fetcher`. L1 → L2 → fetch.
 * Concurrent calls for the same key share the in-flight Promise so the network
 * is only hit once per page.
 *
 * @param source Data source identifier (used for L2 filtering).
 * @param siteId Site id the data is scoped to.
 * @param fetcher Function that returns a Promise with fresh data on cache miss.
 * @param ttlMinutes TTL in minutes. Defaults to 30.
 */
export async function getOrFetchProjectsCache<T>(
  source: ProjectsCacheSource,
  siteId: string,
  fetcher: () => Promise<T>,
  ttlMinutes: number = DEFAULT_TTL_MINUTES
): Promise<T> {
  const key = buildKey(source, siteId)

  const l1 = readL1<T>(key)
  if (l1 !== undefined) return l1

  const l2 = readL2<T>(key)
  if (l2 !== undefined) {
    memory.set(key, { data: l2, expiresAt: Date.now() + ttlMinutes * 60 * 1000 })
    return l2
  }

  const existing = inFlight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const promise = (async () => {
    try {
      const data = await fetcher()
      writeCache(source, key, data, ttlMinutes)
      return data
    } finally {
      inFlight.delete(key)
    }
  })()
  inFlight.set(key, promise)
  return promise
}

/**
 * Invalidate a specific (source, siteId) entry. Removes from L1, L2 and any
 * in-flight Promise. Useful when a mutation is known to have changed the data.
 */
export function invalidateProjectsCache(source: ProjectsCacheSource, siteId: string): void {
  const key = buildKey(source, siteId)
  memory.delete(key)
  inFlight.delete(key)
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}

/**
 * Clear all cached project data from both tiers. Used in tests and on sign-out.
 */
export function clearProjectsCache(): void {
  memory.clear()
  inFlight.clear()
  if (typeof sessionStorage === 'undefined') return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(SESSION_STORAGE_PREFIX)) keysToRemove.push(key)
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key))
  } catch {
    // ignore
  }
}
