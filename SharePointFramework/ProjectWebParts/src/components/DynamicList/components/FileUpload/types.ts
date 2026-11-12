/**
 * Configures file selection, upload feedback and the optional full-screen drop overlay.
 */
export interface IFileUploadZoneProps {
  /**
   * Callback fired when files are selected or dropped for upload.
   *
   */
  onFilesSelected: (files: File[]) => void

  isUploading?: boolean

  uploadText?: string

  /**
   * File types to accept (e.g., ".pdf,.doc,.docx").
   */
  accept?: string

  /**
   * Enable full-screen overlay mode. When true, the component wraps
   * children and shows a full-screen drop zone overlay when dragging files.
   */
  fullScreen?: boolean

  /**
   * Children to render when in full-screen mode.
   */
  children?: React.ReactNode
}
