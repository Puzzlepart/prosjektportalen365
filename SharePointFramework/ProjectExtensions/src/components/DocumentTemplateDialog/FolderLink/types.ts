/** Folder link content and navigation callback. */
export interface IFolderLinkProps {
  name: string

  /** Server-relative URL used to restore focus. */
  url: string

  onClick: () => void
}
