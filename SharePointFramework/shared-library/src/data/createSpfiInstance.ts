import { SPFx, spfi } from '@pnp/sp'
import { SPFxContext } from '../types'

/**
 * Creates a new SP instance with default configuration.
 *
 * @param spfxContext SPFx context
 */
export function createSpfiInstance(spfxContext?: SPFxContext) {
  return spfi().using(SPFx(spfxContext))
}
