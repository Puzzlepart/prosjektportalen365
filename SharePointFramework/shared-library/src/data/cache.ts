import { getHashCode, dateAdd, PnPClientStorage, TimelinePipe } from '@pnp/core'
import { Caching, Queryable } from '@pnp/queryable'

/**
 * Local caching configuration.
 *
 * - `store`: `local`
 * - `keyFactory`: Hash code of the URL
 * - `expireFunc`: Depends on the `expiryMinutes` parameter
 *
 * @param expiryMinutes Number of minutes to cache the data
 */
export const LocalCaching = (expiryMinutes = 60) =>
  Caching({
    store: 'local',
    keyFactory: (url) => getHashCode(url.toLowerCase()).toString(),
    expireFunc: () => dateAdd(new Date(), 'minute', expiryMinutes)
  })

/**
 * Default caching configuration.
 *
 * - `store`: `local`
 * - `keyFactory`: Hash code of the URL
 * - `expireFunc`: 60 minutes from now
 */
export const DefaultCaching = LocalCaching(60)

/**
 * Cache-busting variant of {@link LocalCaching} for explicit, user-initiated
 * refresh actions. Deletes the cached entry for the request (same key factory
 * as `LocalCaching`) right before it is sent, so the request always hits the
 * server — and the fresh response is re-cached under the same key, meaning
 * subsequent `LocalCaching`/`DefaultCaching` reads also see the fresh data.
 *
 * NOTE: assumes the default URL-hash key factory — do not combine with PnPjs'
 * `CacheKey()` behavior, whose custom key would not be busted.
 *
 * @param expiryMinutes Number of minutes to cache the fresh response
 */
export const LocalCachingRefresh =
  (expiryMinutes = 60): TimelinePipe<Queryable> =>
  (instance: Queryable) => {
    const storage = new PnPClientStorage()
    // Registered before LocalCaching's `pre` handler, so the entry is gone by
    // the time the cache is read — guaranteeing a miss and a fresh fetch.
    instance.on.pre(async function (url, init, result) {
      storage.local.delete(getHashCode(url.toLowerCase()).toString())
      return [url, init, result]
    })
    return LocalCaching(expiryMinutes)(instance)
  }

/**
 * Default cache-busting configuration — {@link LocalCachingRefresh} with the
 * same 60 minute expiry as {@link DefaultCaching}.
 */
export const DefaultCachingRefresh = LocalCachingRefresh(60)
