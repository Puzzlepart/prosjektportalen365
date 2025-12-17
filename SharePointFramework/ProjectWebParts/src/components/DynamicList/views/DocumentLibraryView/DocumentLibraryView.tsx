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
import '@pnp/sp/lists'
import '@pnp/sp/folders'
import '@pnp/sp/files'
import '@pnp/sp/files/folder'
import styles from './DocumentLibraryView.module.scss'

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
        // Get the root path by removing any folder path from the first item
        const firstItemPath = filteredItems[0].FileDirRef
        const parts = firstItemPath.split('/')
        // The library root should be everything before the last folder
        // For document library: /sites/site/LibraryName
        // For items that might be in folders already, we need to find the library root
        if (filteredItems[0].FSObjType === 1 || filteredItems[0].FSObjType === 0) {
          // Try to extract library root by looking at the path structure
          const pathSegments = firstItemPath.split('/').filter(Boolean)
          if (pathSegments.length >= 3) {
            // Typically: ['sites', 'sitename', 'libraryname', ...folders]
            libraryRootPath = '/' + pathSegments.slice(0, 3).join('/')
          }
        }
      }

      console.log('[DocumentLibraryView] Filtering items:', {
        currentPath,
        projectFolderName,
        libraryRootPath,
        useProjectFolder: context.props.useProjectFolder,
        totalItems: filteredItems.length,
        sampleItemPaths: filteredItems.slice(0, 3).map(i => i.FileDirRef)
      })

      itemsToDisplay = filteredItems.filter((item: IFileItem) => {
        if (!item.FileDirRef) return false

        // When useProjectFolder is active and no current path, show items in project folder
        if (!currentPath && projectFolderName) {
          const projectFolderPath = `${libraryRootPath}/${projectFolderName}`
          const match = item.FileDirRef === projectFolderPath
          if (!match && filteredItems.indexOf(item) < 3) {
            console.log('[DocumentLibraryView] Item at root with project folder (no match):', {
              itemPath: item.FileDirRef,
              expectedPath: projectFolderPath,
              itemName: item.FileLeafRef
            })
          }
          return match
        } else if (!currentPath) {
          // No project folder, show library root
          return item.FileDirRef === libraryRootPath
        } else {
          // In a subfolder
          const fullCurrentPath = `${libraryRootPath}/${currentPath}`
          return item.FileDirRef === fullCurrentPath
        }
      })

      console.log('[DocumentLibraryView] Filtered to', itemsToDisplay.length, 'items')
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
  }, [filteredItems, viewMode, context.state.currentFolderPath, context.props.useProjectFolder, context.props.webTitle])

  const breadcrumbItems = useMemo(() => {
    const currentPath = context.state.currentFolderPath || ''
    const projectFolderName = context.props.useProjectFolder ? context.props.webTitle : null
    const isAtProjectFolder = projectFolderName && currentPath === projectFolderName

    console.log('[DocumentLibraryView] Breadcrumb calculation:', {
      currentPath,
      projectFolderName,
      isAtProjectFolder,
      useProjectFolder: context.props.useProjectFolder
    })

    if (!currentPath) {
      const targetPath = projectFolderName || ''
      console.log('[DocumentLibraryView] No current path, root will navigate to:', targetPath)
      return [
        {
          text: projectFolderName || context.state.data?.listTitle || 'Documents',
          key: 'root',
          onClick: () => {
            console.log('[DocumentLibraryView] Root clicked, navigating to:', targetPath)
            context.setState({ currentFolderPath: targetPath })
          }
        }
      ]
    }

    const rootTargetPath = projectFolderName || ''
    const items = [
      {
        text: projectFolderName || context.state.data?.listTitle || 'Documents',
        key: 'root',
        onClick: isAtProjectFolder ? undefined : () => {
          console.log('[DocumentLibraryView] Root breadcrumb clicked, navigating to:', rootTargetPath)
          context.setState({ currentFolderPath: rootTargetPath })
        }
      }
    ]

    const pathSegments = currentPath.split('/').filter(Boolean)
    let accumulatedPath = ''

    pathSegments.forEach((segment, index) => {
      // Skip the project folder segment if useProjectFolder is active (it's already the root)
      if (projectFolderName && segment === projectFolderName) {
        return
      }

      accumulatedPath += (accumulatedPath ? '/' : '') + segment
      const isLast = index === pathSegments.length - 1
      const pathForClick = projectFolderName && !accumulatedPath.startsWith(projectFolderName + '/')
        ? `${projectFolderName}/${accumulatedPath}`
        : accumulatedPath

      items.push({
        text: segment,
        key: pathForClick,
        onClick: isLast ? undefined : () => context.setState({ currentFolderPath: pathForClick })
      })
    })

    return items
  }, [context.state.currentFolderPath, context.state.data?.listTitle, context.props.useProjectFolder, context.props.webTitle, context.setState])

  const columns: IListViewColumn[] = useMemo(() => {
    return baseColumns.filter((col) => {
      const columnId = col.columnId
      return columnId !== 'Title'
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
        const projectFolderName = context.props.useProjectFolder ? context.props.webTitle : null

        let newPath: string

        // Build the new path
        if (!currentPath) {
          // At root - if useProjectFolder, go into project folder first
          newPath = projectFolderName ? `${projectFolderName}/${fileName}` : fileName
        } else {
          // Already in a folder - append the new folder name
          newPath = `${currentPath}/${fileName}`
        }

        console.log('[DocumentLibraryView] handleFileClick - Navigating to folder:', {
          fileName,
          currentPath,
          projectFolderName,
          useProjectFolder: context.props.useProjectFolder,
          newPath
        })

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
    [
      context.state.currentFolderPath,
      context.setState,
      context.props.webUrl,
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
        // Use context.web for file operations
        const list = context.web.lists.getByTitle(context.props.listName)
        let folderPath = context.state.currentFolderPath || ''

        // If useProjectFolder is enabled, ensure project folder exists and adjust folder path
        if (context.props.useProjectFolder) {
          const projectFolderName = context.props.webTitle
          if (projectFolderName) {
            try {
              await list.rootFolder.folders.getByUrl(projectFolderName)()
            } catch {
              await list.rootFolder.folders.addUsingPath(projectFolderName)
            }
            // If no current folder or current folder doesn't start with project folder, prepend it
            if (!folderPath) {
              folderPath = projectFolderName
            } else if (!folderPath.startsWith(projectFolderName + '/') && folderPath !== projectFolderName) {
              folderPath = `${projectFolderName}/${folderPath}`
            }
          }
        }

        for (const file of files) {
          let addedFile
          if (folderPath) {
            // Use list.rootFolder.folders.getByUrl() for better reliability
            console.log('[DocumentLibraryView] Uploading to folder:', {
              listName: context.props.listName,
              folderPath
            })
            const targetFolder = list.rootFolder.folders.getByUrl(folderPath)
            addedFile = await targetFolder.files.addUsingPath(file.name, file, { Overwrite: true })
          } else {
            addedFile = await list.rootFolder.files.addUsingPath(file.name, file, {
              Overwrite: true
            })
          }

          if (context.props.useSiteIdFiltering && addedFile) {
            try {
              const siteId = context.props.siteId
              const siteTitle = context.props.webTitle

              if (siteId || siteTitle) {
                // Get the list item associated with the file
                const fileItem = await addedFile.file.getItem()
                const updateProps: Record<string, any> = {}
                if (siteId) updateProps.GtSiteId = siteId
                if (siteTitle) updateProps.GtSiteTitle = siteTitle

                await fileItem.update(updateProps)
              }
            } catch (err) {
              console.error('Error setting GtSiteId/GtSiteTitle on file:', err)
            }
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
        emptyMessage={
          breadcrumbItems.length > 1
            ? 'Ingen dokumenter å vise i valgt mappe, gå tilbake ved å navigere i menyen over'
            : 'Ingen dokumenter å vise'
        }
        noColumnsMessage='Ingen kolonner å vise'
        className={styles.documentLibraryView}
      />
    </FileUploadZone>
  )
}
