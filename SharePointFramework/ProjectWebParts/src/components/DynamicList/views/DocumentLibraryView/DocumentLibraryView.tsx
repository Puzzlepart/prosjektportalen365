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
import { FileUploadZone } from '../../components/FileUpload'
import { useFileUpload } from '../../hooks'
import styles from './DocumentLibraryView.module.scss'
import * as strings from 'ProjectWebPartsStrings'

/**
 * DocumentLibraryView displays SharePoint document library items.
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
   *
   * @param source The items to filter: those the search and filters leave, or all
   */
  const itemsInView = (source: Record<string, any>[]): Record<string, any>[] => {
    let itemsToDisplay = source

    if (viewMode === DocumentLibraryViewMode.Folders) {
      const currentPath = context.state.currentFolderPath || ''
      const projectFolderName = context.props.useProjectFolder ? context.props.webTitle : null

      let libraryRootPath = ''
      if (source.length > 0 && source[0].FileDirRef) {
        libraryRootPath = source[0].FileDirRef
        const firstItemPath = source[0].FileDirRef
        const parts = firstItemPath.split('/')
        if (source[0].FSObjType === 1 || source[0].FSObjType === 0) {
          const pathSegments = firstItemPath.split('/').filter(Boolean)
          if (pathSegments.length >= 3) {
            libraryRootPath = '/' + pathSegments.slice(0, 3).join('/')
          }
        }
      }

      sessionStorage.DEBUG ||
        (DEBUG &&
          console.log('[DocumentLibraryView] Filtering items:', {
            currentPath,
            projectFolderName,
            libraryRootPath,
            useProjectFolder: context.props.useProjectFolder,
            totalItems: source.length,
            sampleItemPaths: source.slice(0, 3).map((i) => i.FileDirRef)
          }))

      itemsToDisplay = source.filter((item: IFileItem) => {
        if (!item.FileDirRef) return false

        if (!currentPath && projectFolderName) {
          const projectFolderPath = `${libraryRootPath}/${projectFolderName}`
          const match = item.FileDirRef === projectFolderPath
          if (!match && source.indexOf(item) < 3) {
            sessionStorage.DEBUG ||
              (DEBUG &&
                console.log('[DocumentLibraryView] Item at root with project folder (no match):', {
                  itemPath: item.FileDirRef,
                  expectedPath: projectFolderPath,
                  itemName: item.FileLeafRef
                }))
          }
          return match
        } else if (!currentPath) {
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
      const aName = a.FileLeafRef || ''
      const bName = b.FileLeafRef || ''
      return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' })
    })

    return itemsToDisplay
  }

  const viewDependencies = [
    viewMode,
    context.state.currentFolderPath,
    context.props.useProjectFolder,
    context.props.webTitle
  ]
  const items = useMemo(() => itemsInView(filteredItems), [filteredItems, ...viewDependencies])
  // The folder's items before the search and the filters, told beside the number shown.
  const total = useMemo(
    () => itemsInView(context.state.data?.listItems ?? []).length,
    [context.state.data?.listItems, ...viewDependencies]
  )

  const breadcrumbItems = useMemo(() => {
    const currentPath = context.state.currentFolderPath || ''
    const projectFolderName = context.props.useProjectFolder ? context.props.webTitle : null
    const isAtProjectFolder = projectFolderName && currentPath === projectFolderName

    if (!currentPath) {
      const targetPath = projectFolderName || ''
      return [
        {
          text: projectFolderName || context.state.data?.listTitle || strings.DynamicList.Documents,
          key: 'root',
          onClick: () => {
            context.setState({ currentFolderPath: targetPath })
          }
        }
      ]
    }

    const rootTargetPath = projectFolderName || ''
    const items = [
      {
        text: projectFolderName || context.state.data?.listTitle || strings.DynamicList.Documents,
        key: 'root',
        onClick: isAtProjectFolder
          ? undefined
          : () => {
              context.setState({ currentFolderPath: rootTargetPath })
            }
      }
    ]

    const pathSegments = currentPath.split('/').filter(Boolean)
    let accumulatedPath = ''

    pathSegments.forEach((segment, index) => {
      if (projectFolderName && segment === projectFolderName) {
        return
      }

      accumulatedPath += (accumulatedPath ? '/' : '') + segment
      const isLast = index === pathSegments.length - 1
      const pathForClick =
        projectFolderName && !accumulatedPath.startsWith(projectFolderName + '/')
          ? `${projectFolderName}/${accumulatedPath}`
          : accumulatedPath

      items.push({
        text: segment,
        key: pathForClick,
        onClick: isLast ? undefined : () => context.setState({ currentFolderPath: pathForClick })
      })
    })

    return items
  }, [
    context.state.currentFolderPath,
    context.state.data?.listTitle,
    context.props.useProjectFolder,
    context.props.webTitle,
    context.setState
  ])

  const columns: IListViewColumn[] = useMemo(() => {
    return baseColumns.filter((col) => {
      const columnId = col.columnId
      return columnId !== 'Title'
    })
  }, [baseColumns])

  /**
   * Handle file/folder click.
   * Only handles folder navigation - files are handled by FileNameColumn's link.
   */
  const handleFileClick = useCallback(
    (item: IFileItem) => {
      const isFolder = item.FSObjType === 1

      if (!isFolder) return

      const fileName = item.FileLeafRef
      const currentPath = context.state.currentFolderPath || ''
      const projectFolderName = context.props.useProjectFolder ? context.props.webTitle : null

      let newPath: string

      if (!currentPath) {
        newPath = projectFolderName ? `${projectFolderName}/${fileName}` : fileName
      } else {
        newPath = `${currentPath}/${fileName}`
      }

      sessionStorage.DEBUG ||
        (DEBUG &&
          console.log('[DocumentLibraryView] handleFileClick - Navigating to folder:', {
            fileName,
            currentPath,
            projectFolderName,
            useProjectFolder: context.props.useProjectFolder,
            newPath
          }))

      context.setState({ currentFolderPath: newPath })
    },
    [
      context.state.currentFolderPath,
      context.setState,
      context.props.useProjectFolder,
      context.props.webTitle
    ]
  )

  /** A drop on the library uploads as the toolbar's upload does, and tells what it did. */
  const uploadFiles = useFileUpload()

  return (
    <FileUploadZone onFilesSelected={uploadFiles} fullScreen>
      {viewMode === DocumentLibraryViewMode.Folders && breadcrumbItems.length > 1 && (
        <div className={styles.breadcrumb}>
          <Breadcrumb aria-label={strings.DynamicList.FolderNavigation}>
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
        total={total}
        isDocumentLibrary
        onFirstColumnClick={handleFileClick}
        emptyMessage={
          breadcrumbItems.length > 1
            ? strings.DynamicList.NoDocumentsInFolder
            : strings.DynamicList.NoDocuments
        }
        noColumnsMessage={strings.DynamicList.NoColumnsToShow}
        className={styles.documentLibraryView}
      />
    </FileUploadZone>
  )
}
