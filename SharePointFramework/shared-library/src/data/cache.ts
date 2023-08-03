import { getHashCode, dateAdd } from '@pnp/core'
import { Caching } from '@pnp/queryable'

/**
 * Default caching configuration.
 *
 * - `store`: `local`
 * - `keyFactory`: Hash code of the URL
 * - `expireFunc`: 60 minutes from now
 */
export const DefaultCaching = Caching({
  store: 'local',
  keyFactory: (url) => getHashCode(url.toLowerCase()).toString(),
  expireFunc: () => dateAdd(new Date(), 'minute', 60)
})
