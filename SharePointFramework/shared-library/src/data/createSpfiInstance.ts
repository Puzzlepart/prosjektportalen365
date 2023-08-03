import { SPFx, spfi } from '@pnp/sp'
import { SPFxContext } from '../types'
import '@pnp/sp/items/get-all'
import '@pnp/sp/presets/all'

/**
 * Creates a new `SPFI` instance with default configuration. The all preset is
 * loaded, so all the modules are available. Also the `get-all` module from
 * `@pnp/sp/items` is loaded, so the `getAll` method is available on lists to
 * get all the items in one query.
 *
 * @param spfxContext SPFx context
 */
export function createSpfiInstance(spfxContext: SPFxContext) {
  return spfi().using(SPFx(spfxContext))
}
