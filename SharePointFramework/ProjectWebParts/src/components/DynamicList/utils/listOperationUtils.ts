import type { IWeb } from '@pnp/sp/webs'
import type { IFileInfo } from '@pnp/sp/files'
import '@pnp/sp/files'
import type { IDynamicListContext } from '../context'

/**
 * Resolves selected items by mapping selected row indices to actual list items.
 *
 * @param context - The DynamicList context containing state with selectedItems and data
 * @returns Array of resolved items (null entries filtered out)
 */
export function getSelectedItems(context: IDynamicListContext): Record<string, any>[] {
  return (context.state.selectedItems || [])
    .map((id) => context.state.data?.listItems?.find((_, idx) => idx === id))
    .filter(Boolean)
}

/**
 * Stamps GtSiteId and GtSiteTitle on a list item when site ID filtering is enabled.
 *
 * @param list - PnPJS list instance
 * @param itemId - ID of the item to stamp
 * @param siteId - The site ID to set
 * @param siteTitle - The site title to set
 */
export async function stampSiteIdFields(
  list: any,
  itemId: number,
  siteId?: string,
  siteTitle?: string
): Promise<void> {
  if (!siteId && !siteTitle) return

  try {
    const updateProps: Record<string, any> = {}
    if (siteId) updateProps.GtSiteId = siteId
    if (siteTitle) updateProps.GtSiteTitle = siteTitle
    await list.items.getById(itemId).update(updateProps)
  } catch (err) {
    console.error('Error setting GtSiteId/GtSiteTitle:', err)
  }
}

/**
 * Stamps GtSiteId and GtSiteTitle on a file item when site ID filtering is enabled.
 *
 * PnPjs v4 `files.addUsingPath` resolves to the created file's `IFileInfo` (no `IFile` handle),
 * so the list item is resolved through `web.getFileByServerRelativePath(...).getItem()`.
 *
 * @param web - The web the file was added to
 * @param addedFile - The `IFileInfo` returned by `files.addUsingPath`
 * @param siteId - The site ID to set
 * @param siteTitle - The site title to set
 */
export async function stampSiteIdFieldsOnFile(
  web: IWeb,
  addedFile: IFileInfo,
  siteId?: string,
  siteTitle?: string
): Promise<void> {
  if (!siteId && !siteTitle) return

  try {
    const fileItem = await web.getFileByServerRelativePath(addedFile.ServerRelativeUrl).getItem()
    const updateProps: Record<string, any> = {}
    if (siteId) updateProps.GtSiteId = siteId
    if (siteTitle) updateProps.GtSiteTitle = siteTitle
    await fileItem.update(updateProps)
  } catch (err) {
    console.error('Error setting GtSiteId/GtSiteTitle on file:', err)
  }
}

/**
 * Detects if an error is likely a CORS or network error.
 */
export function isCorsError(error: any): boolean {
  const message = error?.message || ''
  return (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('CORS')
  )
}

/**
 * Builds the standard payload for custom action POST requests.
 *
 * @param context - The DynamicList context
 * @param actionName - Name of the custom action
 * @param selectedItems - Resolved selected items
 */
export function buildCustomActionPayload(
  context: IDynamicListContext,
  actionName: string,
  selectedItems: Record<string, any>[]
): Record<string, any> {
  const user = context.props.pageContext?.user
  return {
    listName: context.props.listName,
    listId: context.state.data?.listId,
    listTitle: context.state.data?.listTitle,
    webUrl: context.props.webUrl || context.props.pageContext?.web?.absoluteUrl,
    siteId: context.props.siteId,
    siteTitle: context.props.webTitle,
    selectedItems,
    currentUser: user
      ? {
          displayName: user.displayName,
          email: user.email,
          loginName: user.loginName
        }
      : null,
    timestamp: new Date().toISOString(),
    actionName
  }
}

/**
 * Ensures a project folder exists in the document library root.
 * Returns the folder path to use for file operations.
 *
 * @param list - PnPJS list instance
 * @param projectFolderName - Name of the project folder to ensure
 * @param currentFolderPath - Current folder path (if navigated)
 * @returns The effective folder path to use
 */
export async function ensureProjectFolder(
  list: any,
  projectFolderName: string,
  currentFolderPath: string = ''
): Promise<string> {
  try {
    await list.rootFolder.folders.getByUrl(projectFolderName)()
  } catch {
    await list.rootFolder.folders.addUsingPath(projectFolderName)
  }

  if (!currentFolderPath) {
    return projectFolderName
  }

  return currentFolderPath
}
