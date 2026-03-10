import { Button, Card, Text } from '@fluentui/react-components'
import { ArrowUploadRegular } from '@fluentui/react-icons'
import React, { FC, useCallback, useState } from 'react'
import styles from './FileUploadZone.module.scss'
import strings from 'ProjectWebPartsStrings'
import { IFileUploadZoneProps } from './types'

/**
 * FileUploadZone provides a drag-and-drop file upload interface with
 * visual feedback for drag-over states and upload progress.
 *
 * Supports both drag-and-drop and traditional file selection via click.
 */
export const FileUploadZone: FC<IFileUploadZoneProps> = ({
  onFilesSelected,
  isUploading,
  uploadText = strings.DynamicList.DragFilesOrClick,
  accept,
  fullScreen = false,
  children
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

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

  const handleClick = useCallback(() => {
    if (!fullScreen) {
      fileInputRef.current?.click()
    }
  }, [fullScreen])

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
                {isUploading
                  ? strings.DynamicList.UploadingFiles
                  : strings.DynamicList.DropFilesToUpload}
              </Text>
              <Text className={styles.overlaySubtext}>
                {isUploading
                  ? strings.DynamicList.PleaseWait
                  : strings.DynamicList.FilesWillBeUploaded}
              </Text>
            </div>
          </div>
        )}
      </div>
    )
  }

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
        <Text className={styles.text}>
          {isUploading ? strings.DynamicList.Uploading : uploadText}
        </Text>
        <Button appearance='subtle' disabled={isUploading}>
          {strings.DynamicList.SelectFiles}
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
