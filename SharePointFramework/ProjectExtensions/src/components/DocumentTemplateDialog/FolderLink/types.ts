export interface IFolderLinkProps {
  /**
   * The folder's name.
   */
  name: string

  /**
   * The folder's server relative URL.
   */
  url: string

  /**
   * Opens the folder.
   */
  onClick: () => void
}
