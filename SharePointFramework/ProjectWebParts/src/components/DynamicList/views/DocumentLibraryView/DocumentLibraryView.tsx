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
import { getWeb } from '../../utils'
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
    const projectFolderName = context.props.useProjectFolder
      ? context.props.pageContext?.web?.title
      : null

    if (!currentPath && !projectFolderName) {
      return [
        {
          text: context.state.data?.listTitle || 'Documents',
          key: 'root',
          onClick: () => context.setState({ currentFolderPath: '' })
        }
      ]
    }

    const items = []

    if (!projectFolderName) {
      items.push({
        text: context.state.data?.listTitle || 'Documents',
        key: 'root',
        onClick: () => context.setState({ currentFolderPath: '' })
      })
    }

    if (projectFolderName) {
      const isAtProjectFolder = currentPath === projectFolderName
      items.push({
        text: projectFolderName,
        key: projectFolderName,
        onClick: isAtProjectFolder ? undefined : () => context.setState({ currentFolderPath: projectFolderName })
      })
    }

    if (currentPath && currentPath !== projectFolderName) {
      const pathSegments = currentPath.split('/').filter(Boolean)
      let accumulatedPath = ''
      const startIndex = projectFolderName && pathSegments[0] === projectFolderName ? 1 : 0

      for (let index = startIndex; index < pathSegments.length; index++) {
        const segment = pathSegments[index]
        accumulatedPath += (accumulatedPath ? '/' : '') + segment
        const isLast = index === pathSegments.length - 1
        const pathForClick = accumulatedPath

        items.push({
          text: segment,
          key: pathForClick,
          onClick: isLast ? undefined : () => context.setState({ currentFolderPath: pathForClick })
        })
      }
    }

    return items
  }, [context.state.currentFolderPath, context.state.data?.listTitle, context.props.useProjectFolder, context.props.pageContext?.web?.title, context.setState])

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
        const web = getWeb(
          context.props.webUrl,
          context.props.pageContext,
          context.props.webContextMode
        )
        const list = web.lists.getByTitle(context.props.listName)
        let folderPath = context.state.currentFolderPath || ''

        if (context.props.useProjectFolder) {
          const projectFolderName = context.props.pageContext?.web?.title
          if (projectFolderName) {
            try {
              await list.rootFolder.folders.getByUrl(projectFolderName)()
            } catch {
              await list.rootFolder.folders.addUsingPath(projectFolderName)
            }
            if (!folderPath) {
              folderPath = projectFolderName
            }
          }
        }

        for (const file of files) {
          let addedFile
          if (folderPath) {
            const targetFolder = list.rootFolder.folders.getByUrl(folderPath)
            addedFile = await targetFolder.files.addUsingPath(file.name, file, { Overwrite: true })
          } else {
            addedFile = await list.rootFolder.files.addUsingPath(file.name, file, {
              Overwrite: true
            })
          }

          if (context.props.useSiteIdFiltering && addedFile) {
            try {
              const siteId = context.props.pageContext?.site?.id?.toString()
              const siteTitle = context.props.pageContext?.web?.title

              if (siteId || siteTitle) {
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
      {viewMode === DocumentLibraryViewMode.Folders &&
        (breadcrumbItems.length > 1 || context.props.useProjectFolder) && (
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
