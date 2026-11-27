/** Sentinel for setup that applies additions without a project template. */
export const NO_TEMPLATE_ID = -1

/**
 * Local-storage key for the pre-setup Quick Launch snapshot: `{ webUrl, nodes }` from getMenuState.
 * Used to restore owner-added links after template navigation replaces the menu.
 */
export const NAVIGATION_NODES_STORAGE_KEY = 'pp_navigationNodes'

/**
 * Session-storage key that says the user asked for the setup of a project that is set up already,
 * so the next page load does not ask again. ProjectWebParts sets it for «Kjør oppsettveiviser»,
 * and the setup itself over a reload into the site's language.
 */
export const SKIP_ALREADY_SETUP_KEY = 'pp_skipAlreadySetupCheck'
