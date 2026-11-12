/** Navigable entry or current location in the folder breadcrumb. */
export interface IFolderNavigationItem {
  key: string

  text: string

  isCurrentItem?: boolean

  onClick?: () => void
}

/** Folder path, optional leading entries and navigation callback for the breadcrumb. */
export interface IFolderNavigationProps {
  items?: IFolderNavigationItem[]

  root: string

  /**
   * Server-relative URL; empty for the library root, omitted for the list of libraries.
   */
  currentFolder?: string

  setFolder: (folder: string) => void
}
