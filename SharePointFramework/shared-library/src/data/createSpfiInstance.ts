import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPFx, spfi } from '@pnp/sp'

/**
 * Creates a new SP instance with default configuration.
 *
 * @param spfxContext SPFx context
 */
export function createSpfiInstance(
  spfxContext?: ApplicationCustomizerContext | ListViewCommandSetContext | WebPartContext
) {
  return spfi().using(SPFx(spfxContext))
}
