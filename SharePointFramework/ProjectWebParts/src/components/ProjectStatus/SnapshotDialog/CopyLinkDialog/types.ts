/**
 * Outcome of copying a snapshot link to the clipboard.
 */
export type CopyLinkStatus = 'copied' | 'failed'

/**
 * Props for `CopyLinkDialog`.
 */
export interface ICopyLinkDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean

  /**
   * Absolute link to the status page that opens with the snapshot shown
   */
  pageLink: string

  /**
   * Absolute link to the snapshot image file
   */
  imageLink: string

  /**
   * Outcome of the last copy, if any
   */
  status?: CopyLinkStatus

  /**
   * Copies the link to the status page
   */
  onCopyPageLink: () => void

  /**
   * Copies the link to the image file
   */
  onCopyImageLink: () => void

  /**
   * Closes the dialog
   */
  onDismiss: () => void
}
