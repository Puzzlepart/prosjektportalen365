import { DocumentLibraryViewMode, IFileItem } from '../../types'

/**
 * What decides which of a library's items a document library view shows.
 */
export interface IItemsInViewOptions {
  /**
   * The folder view or the flat view.
   */
  viewMode: DocumentLibraryViewMode

  /**
   * The folder open, relative to the library's root; empty or missing at the root.
   */
  currentFolderPath?: string

  /**
   * The project's own folder, which is the root shown when the web part keeps to it.
   */
  projectFolderName?: string
}

/**
 * The items a document library view shows, in name order. In the folder view, those in the open
 * folder by `FileDirRef` (the parent folder's URL), as `DocumentTemplateDialog` does; at the root,
 * those in the project's folder when the web part keeps to it. In the flat view, the files of
 * every folder.
 *
 * @param source The items to choose from: those the search and filters leave, or all
 * @param options What decides it
 */
export function getItemsInView(
  source: Record<string, any>[],
  { viewMode, currentFolderPath, projectFolderName }: IItemsInViewOptions
): Record<string, any>[] {
  let itemsToDisplay = source

  if (viewMode === DocumentLibraryViewMode.Folders) {
    const currentPath = currentFolderPath || ''

    let libraryRootPath = ''
    if (source.length > 0 && source[0].FileDirRef) {
      libraryRootPath = source[0].FileDirRef
      const firstItemPath = source[0].FileDirRef
      if (source[0].FSObjType === 1 || source[0].FSObjType === 0) {
        const pathSegments = firstItemPath.split('/').filter(Boolean)
        if (pathSegments.length >= 3) {
          libraryRootPath = '/' + pathSegments.slice(0, 3).join('/')
        }
      }
    }

    sessionStorage.DEBUG ||
      (DEBUG &&
        console.log('[DocumentLibraryView] Filtering items:', {
          currentPath,
          projectFolderName,
          libraryRootPath,
          totalItems: source.length,
          sampleItemPaths: source.slice(0, 3).map((i) => i.FileDirRef)
        }))

    itemsToDisplay = source.filter((item: IFileItem) => {
      if (!item.FileDirRef) return false

      if (!currentPath && projectFolderName) {
        const projectFolderPath = `${libraryRootPath}/${projectFolderName}`
        const match = item.FileDirRef === projectFolderPath
        if (!match && source.indexOf(item) < 3) {
          sessionStorage.DEBUG ||
            (DEBUG &&
              console.log('[DocumentLibraryView] Item at root with project folder (no match):', {
                itemPath: item.FileDirRef,
                expectedPath: projectFolderPath,
                itemName: item.FileLeafRef
              }))
        }
        return match
      } else if (!currentPath) {
        return item.FileDirRef === libraryRootPath
      } else {
        const fullCurrentPath = `${libraryRootPath}/${currentPath}`
        return item.FileDirRef === fullCurrentPath
      }
    })
  }

  if (viewMode === DocumentLibraryViewMode.Flat) {
    itemsToDisplay = itemsToDisplay.filter((item: IFileItem) => item.FSObjType !== 1)
  }

  return [...itemsToDisplay].sort((a: IFileItem, b: IFileItem) => {
    const aName = a.FileLeafRef || ''
    const bName = b.FileLeafRef || ''
    return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' })
  })
}
