import { Icon } from '@fluentui/react/lib/Icon'
import React, { FC, useContext, useMemo, useCallback } from 'react'
import { DynamicListContext } from '../../context'
import { useColumns } from '../../useColumns'
import { useFilteredData } from '../../useFilteredData'
import { ListView, IListViewColumn } from '../ListView'
import { IFileItem } from '../../types'
import { TableCellLayout } from '@fluentui/react-components'
import { FileUploadZone } from '../../components/FileUpload'
import { getWeb } from '../../utils'
import '@pnp/sp/lists'
import '@pnp/sp/folders'
import '@pnp/sp/files'
import '@pnp/sp/files/folder'
import styles from './DocumentLibraryView.module.scss'

/**
 * DocumentLibraryView displays SharePoint document library items with file-specific
 * columns including file icons, names, modified dates, modified by, and file sizes.
 *
 * Uses the base ListView component with document library-specific column rendering.
 * Supports folder navigation and Office Online integration.
 *
 * @component
 * @example
 * ```tsx
 * <DocumentLibraryView />
 * ```
 */
export const DocumentLibraryView: FC = () => {
  const context = useContext(DynamicListContext)
  const baseColumns = useColumns()
  const filteredItems = useFilteredData()

  /**
   * Map file extensions to Fluent UI icon names.
   */
  const getFileIcon = (extension: string): string => {
    const ext = extension?.toLowerCase()
    switch (ext) {
      case 'docx':
      case 'doc':
        return 'WordDocument'
      case 'xlsx':
      case 'xls':
        return 'ExcelDocument'
      case 'pptx':
      case 'ppt':
        return 'PowerPointDocument'
      case 'pdf':
        return 'PDF'
      case 'txt':
        return 'TextDocument'
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'FileImage'
      default:
        return 'Page'
    }
  }

  /**
   * Format file size from bytes to human-readable format.
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i]
  }

  /**
   * Override column rendering for document library-specific columns.
   */
  const columns: IListViewColumn[] = useMemo(() => {
    return baseColumns.map((col) => {
      const columnId = col.columnId

      // Add file icon to first column (typically Name or Title)
      if (columnId === 'FileLeafRef' || columnId === 'Title') {
        return {
          ...col,
          renderCell: (item: IFileItem) => {
            const isFolder = item.FSObjType === 1
            return (
              <TableCellLayout
                media={
                  <Icon iconName={isFolder ? 'FabricFolder' : getFileIcon(item.File_x0020_Type)} />
                }
              >
                {item[columnId]}
              </TableCellLayout>
            )
          }
        }
      }

      // Format file size
      if (
        columnId === 'File' ||
        columnId === 'File.Length' ||
        (col as any).fieldName === 'File_x0020_Size'
      ) {
        return {
          ...col,
          renderCell: (item: IFileItem) => (
            <TableCellLayout>
              {item.File?.Length ? formatFileSize(item.File.Length) : ''}
            </TableCellLayout>
          )
        }
      }

      // Format dates
      if (columnId === 'Modified' || columnId === 'Created') {
        return {
          ...col,
          renderCell: (item: any) => (
            <TableCellLayout>
              {item[columnId] ? new Date(item[columnId]).toLocaleString('nb-NO') : ''}
            </TableCellLayout>
          )
        }
      }

      // Format user fields
      if (columnId === 'Editor' || columnId === 'Author') {
        return {
          ...col,
          renderCell: (item: any) => (
            <TableCellLayout>{item[columnId]?.Title || ''}</TableCellLayout>
          )
        }
      }

      return col
    })
  }, [baseColumns])

  const handleFileClick = (item: IFileItem) => {
    const isFolder = item.FSObjType === 1

    if (isFolder) {
      // Navigate to folder
      context.setState({ currentFolderPath: item.FileRef })
    } else {
      // Open file in Office Online or default viewer
      if (item.FileRef) {
        window.open(item.FileRef, '_blank')
      }
    }
  }

  /**
   * Handle file upload from drag and drop.
   */
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (!context.props.listName) return

      try {
        const web = getWeb(context.props.webUrl, context.props.pageContext)
        const list = web.lists.getByTitle(context.props.listName)
        const folderPath = context.state.currentFolderPath || ''

        for (const file of files) {
          if (folderPath) {
            // Upload to specific folder
            const targetFolder = list.rootFolder.folders.getByUrl(folderPath)
            await targetFolder.files.addUsingPath(file.name, file, { Overwrite: true })
          } else {
            // Upload to root folder
            await list.rootFolder.files.addUsingPath(file.name, file, { Overwrite: true })
          }
        }

        context.setState({ refetch: Date.now() })
      } catch (error) {
        console.error('Error uploading files:', error)
      }
    },
    [context.props, context.state.currentFolderPath, context.setState]
  )

  return (
    <FileUploadZone onFilesSelected={handleFilesSelected} fullScreen>
      <ListView
        columns={columns as any}
        items={filteredItems}
        onFirstColumnClick={handleFileClick}
        emptyMessage='Ingen dokumenter å vise'
        noColumnsMessage='Ingen kolonner å vise'
        className={styles.documentLibraryView}
      />
    </FileUploadZone>
  )
}
