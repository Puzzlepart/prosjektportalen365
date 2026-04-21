/**
 * Props for the FileUploadZone component.
 */
export interface IFileUploadZoneProps {
  /**
   * Callback fired when files are selected or dropped for upload.
   *
   * @param files - The files selected for upload
   */
  onFilesSelected: (files: File[]) => void

  /**
   * Indicates whether a file upload is currently in progress.
   */
  isUploading?: boolean

  /**
   * Custom text to display in the upload zone.
   */
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
