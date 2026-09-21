import { SPFx, spfi } from '@pnp/sp'
import { SPFxContext } from '../types'
import '@pnp/sp/presets/all'

/**
 * Creates a new `SPFI` instance with default configuration. The all preset is
 * loaded, so all the modules are available.
 *
 * PnPjs 4 has no `getAll()` on item collections; use `getAllItems` from this
 * folder to page through a whole list.
 *
 * @param spfxContext SPFx context
 */
export function createSpfiInstance(spfxContext: SPFxContext) {
  return spfi().using(SPFx(spfxContext))
}
