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
import { stampSiteIdFieldsOnFile } from '../../utils/listOperationUtils'
import '@pnp/sp/lists'
import '@pnp/sp/folders'
import '@pnp/sp/files'
import '@pnp/sp/files/folder'
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
   */
  const items = useMemo(() => {
    let itemsToDisplay = filteredItems

    if (viewMode === DocumentLibraryViewMode.Folders) {
      const currentPath = context.state.currentFolderPath || ''
      const projectFolderName = context.props.useProjectFolder ? context.props.webTitle : null

      let libraryRootPath = ''
      if (filteredItems.length > 0 && filteredItems[0].FileDirRef) {
        libraryRootPath = filteredItems[0].FileDirRef
        const firstItemPath = filteredItems[0].FileDirRef
        const parts = firstItemPath.split('/')
        if (filteredItems[0].FSObjType === 1 || filteredItems[0].FSObjType === 0) {
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
            totalItems: filteredItems.length,
            sampleItemPaths: filteredItems.slice(0, 3).map((i) => i.FileDirRef)
          }))

      itemsToDisplay = filteredItems.filter((item: IFileItem) => {
        if (!item.FileDirRef) return false

        if (!currentPath && projectFolderName) {
          const projectFolderPath = `${libraryRootPath}/${projectFolderName}`
          const match = item.FileDirRef === projectFolderPath
          if (!match && filteredItems.indexOf(item) < 3) {
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
  }, [
    filteredItems,
    viewMode,
    context.state.currentFolderPath,
    context.props.useProjectFolder,
    context.props.webTitle
  ])

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

  /**
   * Handle file upload via drag-and-drop or file selection. If inside a folder, uploads
   * to that folder; otherwise uploads to the root of the document library.
   */
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      try {
        const list = context.web.lists.getByTitle(context.props.listName)
        let folderPath = context.state.currentFolderPath || ''

        if (context.props.useProjectFolder) {
          const projectFolderName = context.props.webTitle
          if (projectFolderName) {
            try {
              await list.rootFolder.folders.getByUrl(projectFolderName)()
            } catch {
              await list.rootFolder.folders.addUsingPath(projectFolderName)
            }
            if (!folderPath) {
              folderPath = projectFolderName
            } else if (
              !folderPath.startsWith(projectFolderName + '/') &&
              folderPath !== projectFolderName
            ) {
              folderPath = `${projectFolderName}/${folderPath}`
            }
          }
        }

        const listData = await list.select('RootFolder/ServerRelativeUrl').expand('RootFolder')()
        const listRootPath = listData.RootFolder.ServerRelativeUrl

        for (const file of files) {
          let addedFile
          if (folderPath) {
            const folderServerRelativeUrl = `${listRootPath}/${folderPath}`
            sessionStorage.DEBUG ||
              (DEBUG &&
                console.log('[DocumentLibraryView] Uploading to folder:', {
                  listName: context.props.listName,
                  folderPath,
                  folderServerRelativeUrl
                }))
            const targetFolder = context.web.getFolderByServerRelativePath(folderServerRelativeUrl)
            addedFile = await targetFolder.files.addUsingPath(file.name, file, { Overwrite: true })
          } else {
            addedFile = await list.rootFolder.files.addUsingPath(file.name, file, {
              Overwrite: true
            })
          }

          if (context.props.useSiteIdFiltering && addedFile) {
            await stampSiteIdFieldsOnFile(addedFile, context.props.siteId, context.props.webTitle)
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
