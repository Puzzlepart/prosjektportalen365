/**
 * Outcome of copying a snapshot link to the clipboard.
 */
export type CopyLinkStatus = 'copied' | 'failed'

/**
 * Snapshot links, clipboard outcome and copy actions shown in the confirmation dialog.
 */
export interface ICopyLinkDialogProps {
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

  onCopyPageLink: () => void

  onCopyImageLink: () => void

  onDismiss: () => void
}
