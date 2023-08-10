import { getHashCode, dateAdd } from '@pnp/core'
import { Caching } from '@pnp/queryable'

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
