import { Icon } from '@fluentui/react/lib/Icon'
import { Breadcrumb, BreadcrumbItem, BreadcrumbButton } from '@fluentui/react-components'
import React, { FC, useContext, useMemo, useCallback } from 'react'
import { DynamicListContext } from '../../context'
import { useColumns } from '../../useColumns'
import { useFilteredData } from '../../useFilteredData'
import { ListView, IListViewColumn } from '../ListView'
import { IFileItem, DocumentLibraryViewMode } from '../../types'
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

  const viewMode =
    context.state.documentLibraryViewMode ||
    context.props.documentLibraryViewMode ||
    DocumentLibraryViewMode.Folders

  /**
   * Filter items based on view mode and current folder.
   * Uses FileDirRef (parent folder URL) - same pattern as DocumentTemplateDialog.
   */
  const items = useMemo(() => {
    let itemsToDisplay = filteredItems

    // In Folders mode, filter by parent folder URL
    if (viewMode === DocumentLibraryViewMode.Folders) {
      const currentPath = context.state.currentFolderPath || ''

      // Get library root path from first item's FileDirRef
      let libraryRootPath = ''
      if (filteredItems.length > 0 && filteredItems[0].FileDirRef) {
        libraryRootPath = filteredItems[0].FileDirRef
      }

      itemsToDisplay = filteredItems.filter((item: IFileItem) => {
        if (!item.FileDirRef) return false

        if (!currentPath) {
          // Root level: show only items whose parent folder is the library root
          return item.FileDirRef === libraryRootPath
        } else {
          // Subfolder: show only items whose parent is the current folder
          const fullCurrentPath = `${libraryRootPath}/${currentPath}`
          return item.FileDirRef === fullCurrentPath
        }
      })
    }

    // In Flat mode, hide folders
    if (viewMode === DocumentLibraryViewMode.Flat) {
      itemsToDisplay = itemsToDisplay.filter((item: IFileItem) => item.FSObjType !== 1)
    }

    return itemsToDisplay
  }, [filteredItems, viewMode, context.state.currentFolderPath])

  const breadcrumbItems = useMemo(() => {
    const currentPath = context.state.currentFolderPath || ''
    if (!currentPath) {
      return [
        {
          text: context.state.data?.listTitle || 'Documents',
          key: 'root',
          onClick: () => context.setState({ currentFolderPath: '' })
        }
      ]
    }

    const items = [
      {
        text: context.state.data?.listTitle || 'Documents',
        key: 'root',
        onClick: () => context.setState({ currentFolderPath: '' })
      }
    ]

    const pathSegments = currentPath.split('/').filter(Boolean)
    let accumulatedPath = ''

    pathSegments.forEach((segment, index) => {
      accumulatedPath += (accumulatedPath ? '/' : '') + segment
      const isLast = index === pathSegments.length - 1
      const pathForClick = accumulatedPath

      items.push({
        text: segment,
        key: pathForClick,
        onClick: isLast ? undefined : () => context.setState({ currentFolderPath: pathForClick })
      })
    })

    return items
  }, [context.state.currentFolderPath, context.state.data?.listTitle, context.setState])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i]
  }

  /**
   * Override column rendering for document library-specific column.
   */
  const columns: IListViewColumn[] = useMemo(() => {
    return baseColumns.map((col) => {
      const columnId = col.columnId

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

      return col
    })
  }, [baseColumns])

  /**
   * Handle file/folder click.
   * Opens folders in the current view, opens files in Office Online.
   */
  const handleFileClick = useCallback(
    (item: IFileItem) => {
      const isFolder = item.FSObjType === 1

      if (isFolder) {
        // Navigate into folder
        const fileName = item.FileLeafRef
        const currentPath = context.state.currentFolderPath || ''
        const newPath = currentPath ? `${currentPath}/${fileName}` : fileName
        context.setState({ currentFolderPath: newPath })
      } else {
        // Open file in Office Online if available
        if (item.FileRef) {
          const siteUrl = context.props.webUrl
          const fileUrl = `${siteUrl}/${item.FileRef}`
          window.open(fileUrl, '_blank')
        }
      }
    },
    [context.state.currentFolderPath, context.setState, context.props.webUrl]
  )

  /**
   * Handle file upload via drag-and-drop or file selection.
   */
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
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
      {viewMode === DocumentLibraryViewMode.Folders && breadcrumbItems.length > 1 && (
        <div className={styles.breadcrumb}>
          <Breadcrumb>
            {breadcrumbItems.map((item) => (
              <BreadcrumbItem key={item.key}>
                {item.onClick ? (
                  <BreadcrumbButton onClick={item.onClick}>{item.text}</BreadcrumbButton>
                ) : (
                  <BreadcrumbButton current>{item.text}</BreadcrumbButton>
                )}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </div>
      )}
      <ListView
        columns={columns as any}
        items={items}
        onFirstColumnClick={handleFileClick}
        emptyMessage='Ingen dokumenter å vise'
        noColumnsMessage='Ingen kolonner å vise'
        className={styles.documentLibraryView}
      />
    </FileUploadZone>
  )
}
