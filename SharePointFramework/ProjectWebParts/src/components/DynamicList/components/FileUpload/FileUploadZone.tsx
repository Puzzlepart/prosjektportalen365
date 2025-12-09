import { Button, Card, Text } from '@fluentui/react-components'
import { ArrowUploadRegular } from '@fluentui/react-icons'
import React, { FC, useCallback, useState } from 'react'
import styles from './FileUploadZone.module.scss'

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

/**
 * FileUploadZone provides a drag-and-drop file upload interface with
 * visual feedback for drag-over states and upload progress.
 *
 * Supports both drag-and-drop and traditional file selection via click.
 *
 * @component
 * @example
 * ```tsx
 * <FileUploadZone
 *   onFilesSelected={(files) => uploadFiles(files)}
 *   isUploading={isUploading}
 *   accept=".pdf,.doc,.docx"
 * />
 * ```
 */
export const FileUploadZone: FC<IFileUploadZoneProps> = ({
  onFilesSelected,
  isUploading,
  uploadText = 'Dra filer hit eller klikk for å laste opp',
  accept,
  fullScreen = false,
  children
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  /**
   * Handle drag over event to show visual feedback.
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  /**
   * Handle drag leave event to remove visual feedback.
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  /**
   * Handle drop event to process dropped files.
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected]
  )

  /**
   * Handle file input change event for traditional file selection.
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : []
      if (files.length > 0) {
        onFilesSelected(files)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [onFilesSelected]
  )

  /**
   * Trigger file input click.
   */
  const handleClick = useCallback(() => {
    if (!fullScreen) {
      fileInputRef.current?.click()
    }
  }, [fullScreen])

  // Full-screen overlay mode
  if (fullScreen) {
    return (
      <div
        className={styles.fullScreenContainer}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {children}
        {isDragOver && (
          <div className={styles.fullScreenOverlay}>
            <div className={styles.overlayContent}>
              <ArrowUploadRegular className={styles.overlayIcon} />
              <Text className={styles.overlayText}>
                {isUploading ? 'Laster opp filer...' : 'Slipp filer her for å laste opp'}
              </Text>
              <Text className={styles.overlaySubtext}>
                {isUploading ? 'Vennligst vent...' : 'Filene vil bli lastet opp til gjeldende mappe'}
              </Text>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Traditional upload zone mode
  return (
    <Card
      className={`${styles.uploadZone} ${isDragOver ? styles.dragOver : ''} ${
        isUploading ? styles.uploading : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className={styles.content}>
        <ArrowUploadRegular className={styles.icon} />
        <Text className={styles.text}>{isUploading ? 'Laster opp...' : uploadText}</Text>
        <Button appearance='subtle' disabled={isUploading}>
          Velg filer
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type='file'
        multiple
        accept={accept}
        onChange={handleFileInputChange}
        className={styles.fileInput}
        disabled={isUploading}
      />
    </Card>
  )
}
