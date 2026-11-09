import * as strings from 'ProjectWebPartsStrings'
import { useCallback, useContext, useMemo } from 'react'
import { DynamicListContext } from '../../context'
import { useFileUpload } from '../../hooks'
import { DocumentLibraryViewMode, IFileItem } from '../../types'
import { useColumns } from '../../useColumns'
import { useFilteredData } from '../../useFilteredData'
import { IListViewColumn } from '../ListView'
import { getItemsInView } from './getItemsInView'

/**
 * Component logic hook for `DocumentLibraryView`: the items the view shows and how many the
 * folder has, the folder trail, the columns, opening a folder, and an upload by a drop on the
 * library, which tells what it did as the toolbar's upload does.
 */
export function useDocumentLibraryView() {
  const context = useContext(DynamicListContext)
  const baseColumns = useColumns()
  const filteredItems = useFilteredData()
  const uploadFiles = useFileUpload()

  const viewMode =
    context.state.documentLibraryViewMode ||
    context.props.documentLibraryViewMode ||
    DocumentLibraryViewMode.Folders
  const currentFolderPath = context.state.currentFolderPath
  const projectFolderName = context.props.useProjectFolder ? context.props.webTitle : undefined

  const items = useMemo(
    () => getItemsInView(filteredItems, { viewMode, currentFolderPath, projectFolderName }),
    [filteredItems, viewMode, currentFolderPath, projectFolderName]
  )
  // The folder's items before the search and the filters, told beside the number shown.
  const total = useMemo(
    () =>
      getItemsInView(context.state.data?.listItems ?? [], {
        viewMode,
        currentFolderPath,
        projectFolderName
      }).length,
    [context.state.data?.listItems, viewMode, currentFolderPath, projectFolderName]
  )

  const breadcrumbItems = useMemo(() => {
    const currentPath = context.state.currentFolderPath || ''
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
    const crumbs = [
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

      crumbs.push({
        text: segment,
        key: pathForClick,
        onClick: isLast ? undefined : () => context.setState({ currentFolderPath: pathForClick })
      })
    })

    return crumbs
  }, [
    context.state.currentFolderPath,
    context.state.data?.listTitle,
    projectFolderName,
    context.setState
  ])

  const columns: IListViewColumn[] = useMemo(() => {
    return baseColumns.filter((col) => {
      const columnId = col.columnId
      return columnId !== 'Title'
    })
  }, [baseColumns])

  /**
   * Opens a folder from the list. Only folders: a file opens through its name's link
   * (`FileNameColumn`).
   */
  const handleFileClick = useCallback(
    (item: IFileItem) => {
      const isFolder = item.FSObjType === 1

      if (!isFolder) return

      const fileName = item.FileLeafRef
      const currentPath = context.state.currentFolderPath || ''

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
    [context.state.currentFolderPath, context.setState, projectFolderName]
  )

  const isInFolder = breadcrumbItems.length > 1

  return {
    items,
    total,
    breadcrumbItems,
    showBreadcrumb: viewMode === DocumentLibraryViewMode.Folders && isInFolder,
    columns,
    handleFileClick,
    uploadFiles,
    emptyMessage: isInFolder
      ? strings.DynamicList.NoDocumentsInFolder
      : strings.DynamicList.NoDocuments
  } as const
}
