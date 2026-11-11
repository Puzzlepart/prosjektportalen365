/**
 * A single entry in the folder trail. Replaces `IBreadcrumbItem` from Fluent UI
 * v8, declaring only the fields this component sets.
 */
export interface IFolderNavigationItem {
  /**
   * Unique key for the entry.
   */
  key: string

  /**
   * Folder name shown in the trail.
   */
  text: string

  /**
   * Whether this is the folder currently open. The last entry is not clickable.
   */
  isCurrentItem?: boolean

  /**
   * Navigates to this folder.
   */
  onClick?: () => void
}

export interface IFolderNavigationProps {
  /**
   * Entries to show before the root, if any.
   */
  items?: IFolderNavigationItem[]

  /**
   * Root level name (typically library name)
   */
  root: string

  /**
   * The folder open: its server relative URL, or an empty string for the root. Left out while
   * the list of libraries is shown, which has no folder open and so no root in the trail.
   */
  currentFolder?: string

  /**
   * Set folder
   *
   * @param folder Folder URL
   */
  setFolder: (folder: string) => void
}
