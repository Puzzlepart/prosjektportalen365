import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbDivider,
  BreadcrumbButton
} from '@fluentui/react-components'
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
   * Sorts folders alphabetically first, then files.
   */
  const items = useMemo(() => {
    let itemsToDisplay = filteredItems

    if (viewMode === DocumentLibraryViewMode.Folders) {
      const currentPath = context.state.currentFolderPath || ''

      let libraryRootPath = ''
      if (filteredItems.length > 0 && filteredItems[0].FileDirRef) {
        libraryRootPath = filteredItems[0].FileDirRef
      }

      itemsToDisplay = filteredItems.filter((item: IFileItem) => {
        if (!item.FileDirRef) return false

        if (!currentPath) {
          return item.FileDirRef === libraryRootPath
        } else {
          const fullCurrentPath = `${libraryRootPath}/${currentPath}`
          return item.FileDirRef === fullCurrentPath
        }
      })
    }

    if (viewMode === DocumentLibraryViewMode.Flat) {
      itemsToDisplay = itemsToDisplay.filter((item: IFileItem) => item.FSObjType !== 1)
    }

    itemsToDisplay = [...itemsToDisplay].sort((a: IFileItem, b: IFileItem) => {
      const aIsFolder = a.FSObjType === 1
      const bIsFolder = b.FSObjType === 1

      if (aIsFolder && !bIsFolder) return -1
      if (!aIsFolder && bIsFolder) return 1

      const aName = a.FileLeafRef || ''
      const bName = b.FileLeafRef || ''
      return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' })
    })

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
   * Filters out Title column and formats file size.
   */
  const columns: IListViewColumn[] = useMemo(() => {
    return baseColumns
      .filter((col) => {
        const columnId = col.columnId
        return columnId !== 'Title'
      })
      .map((col) => {
        const columnId = col.columnId

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
        const fileName = item.FileLeafRef
        const currentPath = context.state.currentFolderPath || ''
        const newPath = currentPath ? `${currentPath}/${fileName}` : fileName
        context.setState({ currentFolderPath: newPath })
      } else {
        if (item.FileRef) {
          const siteUrl = context.props.webUrl.replace(/\/$/, '')
          const fileUrl = `${siteUrl}/_layouts/15/Doc.aspx?sourcedoc=${encodeURIComponent(
            item.FileRef
          )}&action=default`
          window.open(fileUrl, '_blank')
        }
      }
    },
    [context.state.currentFolderPath, context.setState, context.props.webUrl]
  )

  /**
   * Handle file upload via drag-and-drop or file selection. If inside a folder, uploads
   * to that folder; otherwise uploads to the root of the document library.
   */
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      try {
        const web = getWeb(context.props.webUrl, context.props.pageContext)
        const list = web.lists.getByTitle(context.props.listName)
        const folderPath = context.state.currentFolderPath || ''

        for (const file of files) {
          if (folderPath) {
            const targetFolder = list.rootFolder.folders.getByUrl(folderPath)
            await targetFolder.files.addUsingPath(file.name, file, { Overwrite: true })
          } else {
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
          <Breadcrumb aria-label='Folder navigation'>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={item.key}>
                <BreadcrumbItem>
                  {item.onClick ? (
                    <BreadcrumbButton onClick={item.onClick}>{item.text}</BreadcrumbButton>
                  ) : (
                    <BreadcrumbButton current>{item.text}</BreadcrumbButton>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && <BreadcrumbDivider />}
              </React.Fragment>
            ))}
          </Breadcrumb>
        </div>
      )}
      <ListView
        columns={columns as any}
        items={items}
        isDocumentLibrary
        onFirstColumnClick={handleFileClick}
        emptyMessage='Ingen dokumenter å vise'
        noColumnsMessage='Ingen kolonner å vise'
        className={styles.documentLibraryView}
      />
    </FileUploadZone>
  )
}
