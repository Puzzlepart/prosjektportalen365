import { IMenuNode } from '@pnp/sp/navigation'

/**
 * The key in local storage that the setup (`projectSetup` in ProjectExtensions) reads the saved
 * Quick Launch from.
 */
export const NAVIGATION_NODES_STORAGE_KEY = 'pp_navigationNodes'

/**
 * The Quick Launch as it is saved: with the web's URL, since local storage is shared by every
 * site on the tenant.
 */
export interface ISavedNavigationNodes {
  webUrl: string
  nodes: IMenuNode[]
}

/**
 * Saves the site's Quick Launch before the setup runs again or makes the project a parent
 * project. The template's menu replaces it, and the setup then adds back the saved nodes the new
 * menu does not have and the template and its extensions do not declare: the links the owners
 * added. When the menu cannot be read, an earlier save is removed, so the setup adds back nothing
 * from another run.
 *
 * @param sp The site's PnPjs instance (`navigation.getMenuState`)
 * @param webUrl The web's absolute URL
 */
export async function saveNavigationNodes(
  sp: { navigation: { getMenuState: () => Promise<{ Nodes: IMenuNode[] }> } },
  webUrl: string
): Promise<void> {
  try {
    const { Nodes } = await sp.navigation.getMenuState()
    const saved: ISavedNavigationNodes = { webUrl, nodes: Nodes }
    localStorage.setItem(NAVIGATION_NODES_STORAGE_KEY, JSON.stringify(saved))
  } catch (error) {
    localStorage.removeItem(NAVIGATION_NODES_STORAGE_KEY)
    console.error('Failed to save navigation nodes:', error)
  }
}
