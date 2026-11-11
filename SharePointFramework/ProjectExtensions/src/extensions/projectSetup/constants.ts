/**
 * Special ID used to represent the 'No template' option in the setup wizard.
 * This allows users to run the setup wizard with only extensions and content config,
 * without applying a template.
 */
export const NO_TEMPLATE_ID = -1

/**
 * The key in local storage of the Quick Launch that ProjectWebParts saves before the setup runs
 * again («Kjør oppsettveiviser») or makes the project a parent project: `{ webUrl, nodes }`, the
 * nodes as `getMenuState` returns them. The setup adds back the links the owners added, which the
 * template's menu removed.
 */
export const NAVIGATION_NODES_STORAGE_KEY = 'pp_navigationNodes'
