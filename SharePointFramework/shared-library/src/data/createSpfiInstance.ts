import type { TimelinePipe } from '@pnp/core'
import { SPFx, spfi } from '@pnp/sp'
import { SPFxContext } from '../types'
import { rememberPageContext } from '../util/pageContext'
import '@pnp/sp/presets/all'

/**
 * Builds the behaviour that connects a client to SharePoint for an SPFx context.
 */
export type SpfiFactory = (spfxContext: SPFxContext) => TimelinePipe<any>

let spfiFactory: SpfiFactory | undefined

/**
 * Replaces how the library's clients connect to SharePoint. On a page they go through SPFx
 * (`SPFx(context)`), which rides on the page's session; outside one, the integration tests in Node
 * register a factory that signs in and resolves URLs against the site instead. `undefined` restores
 * SPFx.
 *
 * @param factory Factory, or `undefined` for SPFx
 */
export function setSpfiFactory(factory?: SpfiFactory): void {
  spfiFactory = factory
}

/**
 * Creates a new `SPFI` instance with default configuration. The all preset is
 * loaded, so all the modules are available.
 *
 * PnPjs 4 has no `getAll()` on item collections; use `getAllItems` from this
 * folder to page through a whole list.
 *
 * Every web part and extension creates its clients from the page's context before it renders, so
 * this is where the library learns the page's cultures and the site's time zone, which it formats
 * dates by (`rememberPageContext`): modern pages expose no page context on `window`.
 *
 * @param spfxContext SPFx context
 */
export function createSpfiInstance(spfxContext: SPFxContext) {
  rememberPageContext(spfxContext)
  return spfi().using(spfiFactory ? spfiFactory(spfxContext) : SPFx(spfxContext))
}
