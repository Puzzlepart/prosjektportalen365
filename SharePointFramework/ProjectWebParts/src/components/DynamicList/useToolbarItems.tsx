import { useMemo, useContext, useCallback } from 'react'
import { DynamicListContext } from './context'
import {
  ListMenuItem,
  ItemFieldValues,
  ListMenuItemDivider,
  customLightTheme
} from 'pp365-shared-library'
import { DocumentLibraryViewMode, CustomActionType, ICustomAction } from './types'
import {
  FilterRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  ContentView24Filled,
  ContentView24Regular,
  ArrowLeftRegular,
  bundleIcon
} from '@fluentui/react-icons'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/folders'
import '@pnp/sp/files'
import '@pnp/sp/files/folder'
import _ from 'lodash'
import { useExcelExport, useCustomActionDialog } from './hooks'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { fetchSingleItem } from './data/fetchListData'
import { getSelectedItems, stampSiteIdFieldsOnFile, buildCustomActionPayload, isCorsError } from './utils/listOperationUtils'
import * as React from 'react'
import {
  Toaster,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  ToastBody,
  FluentProvider,
  IdPrefixProvider
} from '@fluentui/react-components'
import * as strings from 'ProjectWebPartsStrings'

const Icons = {
  ContentView: bundleIcon(ContentView24Filled, ContentView24Regular)
}

export function useToolbarItems(isSingleView: boolean = false, showNewButton: boolean = true) {
  const context = useContext(DynamicListContext)
  const exportToExcel = useExcelExport()
  const toasterId = useId('toaster')
  const fluentProviderId = useId('fp-dynamic-list-actions')
  const { dispatchToast } = useToastController(toasterId)
  const { openDialog, dialogComponent, toasterId: dialogToasterId } = useCustomActionDialog()

  ExcelExportService.configure({
    name: context.props.title?.trim() || context.state.data?.listTitle || 'Export'
  })

  const checkedValues = useMemo(() => {
    const viewMode =
      context.state.documentLibraryViewMode ||
      context.props.documentLibraryViewMode ||
      DocumentLibraryViewMode.Folders

    return {
      views: [context.state.currentView?.id],
      documentViewMode: [viewMode]
    }
  }, [
    context.state.currentView?.id,
    context.state.documentLibraryViewMode,
    context.props.documentLibraryViewMode
  ])

  /**
   * Handle view selection change.
   *
   * Finds the selected view, updates the current view state, and triggers a data refetch
   * with the new view's field configuration. The refetch is delayed using setTimeout to
   * ensure state is updated before triggering the data fetch.
   *
   * @param viewId The ID of the view to switch to
   */
  const onViewChange = useCallback(
    async (viewId: string) => {
      if (viewId === context.state.currentView?.id) return

      context.setState({ isChangingView: true })

      const selectedView = context.state.views?.find((v) => v.id === viewId)
      if (!selectedView) return

      context.setState({
        currentView: selectedView,
        isChangingView: false
      })

      setTimeout(() => {
        context.setState({ refetch: Date.now() })
      }, 0)
    },
    [context.state, context.setState]
  )

  /**
   * Delete selected items with confirmation.
   *
   * Prompts the user for confirmation, then deletes all selected items from the list
   * and removes them from state without refetching.
   */
  const deleteItems = useCallback(async () => {
    if (!context.props.listName) return

    const selectedCount = context.state.selectedItems.length
    const confirmMessage = selectedCount === 1
      ? strings.DynamicList.ConfirmDelete.replace('{0}', selectedCount.toString())
      : strings.DynamicList.ConfirmDeleteMultiple.replace('{0}', selectedCount.toString())

    const confirmed = window.confirm(confirmMessage)

    if (!confirmed) return

    const list = context.web.lists.getByTitle(context.props.listName)

    const selected = getSelectedItems(context)

    await Promise.all(
      selected.map(async (item: any) => {
        if (item?.Id) {
          await list.items.getById(item.Id).delete()
        }
      })
    )

    const deletedItemIds = new Set(selected.map((item: any) => item?.Id).filter(Boolean))
    const updatedListItems = context.state.data.listItems.filter(
      (item: any) => !deletedItemIds.has(item.Id)
    )

    context.setState({
      selectedItems: [],
      data: {
        ...context.state.data,
        listItems: updatedListItems
      }
    })
  }, [context.state, context.props, context.setState])

  /**
   * Dismisses the edit panel and triggers a data refetch.
   * Clears selected items, closes the panel, and refreshes the list data.
   */
  const dismissPanel = useCallback(() => {
    context.setState({
      selectedItems: [],
      refetch: Date.now(),
      panel: null
    })
  }, [context.setState])

  /**
   * Dismisses the panel and adds a newly created item to the current state
   * without triggering a full refetch. Uses fetchSingleItem to ensure the same
   * transformation logic as fetchListData.
   */
  const dismissPanelWithNewItem = useCallback(
    async (itemId: number) => {
      try {
        const transformedItem = await fetchSingleItem(
          context.props,
          context.web,
          itemId,
          context.state.data?.listColumns
        )

        const updatedListItems = [transformedItem, ...(context.state.data?.listItems || [])]

        context.setState({
          selectedItems: [],
          panel: null,
          data: {
            ...context.state.data,
            listItems: updatedListItems
          }
        })
      } catch (error) {
        console.error('[DynamicList] Error fetching new item:', error)
        dismissPanel()
      }
    },
    [context.props, context.state.data, context.setState, context.web, dismissPanel]
  )

  /**
   * Upload files to the document library.
   *
   * @param files The files to upload
   */
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!context.props.listName) return

      try {
        const list = context.web.lists.getByTitle(context.props.listName)
        let folderPath = context.state.currentFolderPath || ''

        if (context.props.useProjectFolder && context.state.isDocumentLibrary) {
          const projectFolderName = context.props.webTitle
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

        const listData = await list.select('RootFolder/ServerRelativeUrl').expand('RootFolder')()
        const listRootPath = listData.RootFolder.ServerRelativeUrl

        for (const file of files) {
          let addedFile
          if (folderPath) {
            const folderServerRelativeUrl = `${listRootPath}/${folderPath}`
            sessionStorage.DEBUG || DEBUG && console.log('[useToolbarItems.uploadFiles] Uploading to folder:', {
              listName: context.props.listName,
              folderPath,
              folderServerRelativeUrl
            })
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
    [
      context.props,
      context.state.currentFolderPath,
      context.state.isDocumentLibrary,
      context.setState
    ]
  )

  /**
   * Create a new blank document in the document library.
   *
   * @param documentType The type of document to create
   */
  const createDocument = useCallback(
    async (documentType: 'word' | 'excel' | 'powerpoint') => {
      if (!context.props.listName) return

      try {
        const list = context.web.lists.getByTitle(context.props.listName)
        let folderPath = context.state.currentFolderPath || ''

        if (context.props.useProjectFolder && context.state.isDocumentLibrary) {
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

        const timestamp = new Date().getTime()

        let fileName: string
        let contentType: string

        switch (documentType) {
          case 'word':
            fileName = strings.DynamicList.NewWordDocument.replace('{0}', timestamp.toString())
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            break
          case 'excel':
            fileName = strings.DynamicList.NewExcelWorkbook.replace('{0}', timestamp.toString())
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            break
          case 'powerpoint':
            fileName = strings.DynamicList.NewPowerPointPresentation.replace('{0}', timestamp.toString())
            contentType =
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            break
        }

        const emptyFile = new Blob([], { type: contentType })
        let addedFile
        if (folderPath) {
          const folderServerRelativeUrl = `${listRootPath}/${folderPath}`
          sessionStorage.DEBUG || DEBUG && console.log('[useToolbarItems.createDocument] Creating in folder:', {
            listName: context.props.listName,
            folderPath,
            folderServerRelativeUrl
          })
          const targetFolder = context.web.getFolderByServerRelativePath(folderServerRelativeUrl)
          addedFile = await targetFolder.files.addUsingPath(fileName, emptyFile, {
            Overwrite: true
          })
        } else {
          addedFile = await list.rootFolder.files.addUsingPath(fileName, emptyFile, {
            Overwrite: true
          })
        }

        if (context.props.useSiteIdFiltering && addedFile) {
          await stampSiteIdFieldsOnFile(addedFile, context.props.siteId, context.props.webTitle)
        }

        context.setState({ refetch: Date.now() })
      } catch (error) {
        console.error('Error creating document:', error)
      }
    },
    [context.props, context.state.currentFolderPath, context.setState]
  )

  /**
   * Adds a new item or updates an existing item in the list.
   *
   * If itemId is null, creates a new item. Otherwise, updates the existing item
   * with the provided ID. After saving, dismisses the panel and refreshes the data.
   *
   * @param itemId The ID of the item to update, or null to create a new item
   * @param properties The properties to save on the item
   */
  const saveItem = useCallback(
    async (itemId: number | null, properties: Record<string, any>) => {
      if (!context.props.listName) return

      const list = context.web.lists.getByTitle(context.props.listName)

      try {
        if (itemId) {
          await list.items.getById(itemId).update(properties)
          dismissPanel()
        } else {
          if (context.props.useSiteIdFiltering) {
            const siteId = context.props.siteId
            const siteTitle = context.props.webTitle
            if (siteId) {
              properties.GtSiteId = siteId
            }
            if (siteTitle) {
              properties.GtSiteTitle = siteTitle
            }
          }

          const result = await list.items.add(properties)
          const newItemId = result.data.ID

          await dismissPanelWithNewItem(newItemId)
        }
      } catch (error) {
        console.error('[DynamicList] Error saving item:', error)
        throw error
      }
    },
    [context.props, dismissPanel, dismissPanelWithNewItem]
  )

  /**
   * Handle Trigger action type - POST selected items to hookUrl
   *
   * @param action The custom action configuration
   */
  const handleTriggerAction = useCallback(
    async (action: ICustomAction) => {
      if (!action.hookUrl) {
        dispatchToast(
          <Toast appearance='inverted'>
            <ToastTitle>{strings.DynamicList.ConfigurationError}</ToastTitle>
            <ToastBody>{strings.DynamicList.HookUrlNotConfigured}</ToastBody>
          </Toast>,
          { intent: 'error' }
        )
        return
      }

      const selected = getSelectedItems(context)

      if (selected.length === 0) {
        dispatchToast(
          <Toast appearance='inverted'>
            <ToastTitle>{strings.DynamicList.NoItemsSelected}</ToastTitle>
            <ToastBody>{strings.DynamicList.NoItemsSelectedMessage}</ToastBody>
          </Toast>,
          { intent: 'warning' }
        )
        return
      }

      try {
        const payload = buildCustomActionPayload(context, action.name, selected)

        const response = await fetch(action.hookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json().catch(() => ({ success: true }))

        dispatchToast(
          <Toast appearance='inverted'>
            <ToastTitle>{action.name}</ToastTitle>
            <ToastBody>{strings.DynamicList.ActionCompleted.replace('{0}', result.message || 'OK')}</ToastBody>
          </Toast>,
          { intent: 'success' }
        )

        // Refresh data after successful action
        context.setState({ refetch: Date.now(), selectedItems: [] })
      } catch (error) {
        console.error('Error executing trigger action:', error)
        const errorMessage = isCorsError(error)
          ? strings.DynamicList.CorsError
          : strings.DynamicList.CouldNotExecuteAction.replace('{0}', error.message)

        dispatchToast(
          <Toast appearance='inverted'>
            <ToastTitle>{strings.DynamicList.ActionFailed}</ToastTitle>
            <ToastBody>{errorMessage}</ToastBody>
          </Toast>,
          { intent: 'error' }
        )
      }
    },
    [context.state, context.props, context.setState]
  )

  const menuItems = useMemo<ListMenuItem[]>(() => {
    const items: ListMenuItem[] = []

    const isInFolder = context.state.isDocumentLibrary && context.state.currentFolderPath
    const showBackButton = context.state.isDrilledDown || isInFolder

    if (showBackButton) {
      items.push(
        new ListMenuItem(strings.DynamicList.Back, strings.DynamicList.BackToListView)
          .setIcon(ArrowLeftRegular)
          .setOnClick(() => {
            if (context.state.isDrilledDown) {
              context.setState({
                isDrilledDown: false,
                selectedItem: undefined,
                selectedItems: []
              })
            } else if (isInFolder) {
              const currentPath = context.state.currentFolderPath || ''
              const pathParts = currentPath.split('/')
              pathParts.pop()
              const newPath = pathParts.join('/')

              context.setState({ currentFolderPath: newPath })
            }
          })
      )
    }

    if (context.state.isDocumentLibrary && showNewButton) {
      const documentMenuItems: ListMenuItem[] = []

      if (context.props.showNewWordButton !== false) {
        documentMenuItems.push(
          new ListMenuItem(strings.DynamicList.WordDocument).setIcon('WordDocument').setOnClick(async () => {
            await createDocument('word')
          })
        )
      }

      if (context.props.showNewExcelButton !== false) {
        documentMenuItems.push(
          new ListMenuItem(strings.DynamicList.ExcelWorkbook).setIcon('ExcelDocument').setOnClick(async () => {
            await createDocument('excel')
          })
        )
      }

      if (context.props.showNewPowerPointButton !== false) {
        documentMenuItems.push(
          new ListMenuItem(strings.DynamicList.PowerPointPresentation)
            .setIcon('PowerPointDocument')
            .setOnClick(async () => {
              await createDocument('powerpoint')
            })
        )
      }

      if (context.props.showUploadButton !== false) {
        documentMenuItems.push(
          new ListMenuItem(strings.DynamicList.UploadFile).setIcon('Upload').setOnClick(() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
            input.onchange = async (e: any) => {
              const files = Array.from(e.target.files || []) as File[]
              if (files.length > 0) {
                await uploadFiles(files)
              }
            }
            input.click()
          })
        )
      }

      if (documentMenuItems.length > 0) {
        items.push(
          new ListMenuItem(strings.DynamicList.New, strings.DynamicList.NewDocumentOrUpload)
            .setDisabled(!context.state.permissions?.canAdd)
            .setIcon(AddRegular)
            .setItems(documentMenuItems)
        )
      }
    } else if (
      showNewButton &&
      !context.state.isDocumentLibrary &&
      context.props.showNewButton !== false
    ) {
      items.push(
        new ListMenuItem(strings.DynamicList.NewItem, strings.DynamicList.CreateNewItem)
          .setDisabled(!context.state.permissions?.canAdd)
          .setIcon(AddRegular)
          .setOnClick(() => {
            const fieldValues = new ItemFieldValues()
            const fields = context.state.data?.fields || []

            context.setState({
              panel: {
                headerText: strings.DynamicList.NewItem,
                fieldValues: fieldValues,
                submit: {
                  onSubmit: async ({ properties }) => {
                    await saveItem(null, properties)
                  }
                }
              }
            })
          })
      )
    }

    if (!context.state.isDocumentLibrary && context.props.showEditButton !== false) {
      items.push(
        new ListMenuItem(strings.DynamicList.EditItem, strings.DynamicList.EditSelectedItem)
          .setIcon(EditRegular)
          .setDisabled(
            !context.state.permissions?.canEdit ||
              !context.state.selectedItems ||
              context.state.selectedItems.length !== 1
          )
          .setOnClick(() => {
            const selected = getSelectedItems(context)

            const item = _.first(selected)
            if (item) {
              const fieldValues = new ItemFieldValues(item)
              context.setState({
                panel: {
                  headerText: strings.DynamicList.EditItem,
                  fieldValues,
                  submit: {
                    onSubmit: async ({ properties }) => {
                      await saveItem(fieldValues.id, properties)
                    }
                  }
                }
              })
            }
          })
      )
    }

    if (!isSingleView && context.props.showSearchBox) {
      items.push(
        new ListMenuItem()
          .setSearchBox({
            placeholder: strings.DynamicList.SearchIn.replace('{0}',
              context.state.currentView?.title?.toLowerCase() ||
              context.state.data?.listTitle?.toLowerCase() ||
              'liste'
            ),
            title: strings.DynamicList.Search,
            'aria-label': strings.DynamicList.Search,
            value: context.state.searchTerm || '',
            onChange: (_, { value }) => context.setState({ searchTerm: value }),
            contentAfter: {
              onClick: () => context.setState({ searchTerm: '' })
            }
          })
          .setDisabled(context.state.isLoading || _.isEmpty(context.state.data.listItems))
      )
    }

    return items
  }, [isSingleView, showNewButton, context.state, context.props, saveItem])

  const farMenuItems = useMemo<ListMenuItem[]>(() => {
    const items: ListMenuItem[] = []

    // Custom actions from web part configuration
    if (
      context.props.showCustomActions !== false &&
      context.props.customActions &&
      context.props.customActions.length > 0
    ) {
      // Sort actions by order field (lower numbers first)
      const sortedActions = [...context.props.customActions].sort((a, b) => {
        const orderA = a.order ?? 100
        const orderB = b.order ?? 100
        return orderA - orderB
      })

      sortedActions.forEach((action: ICustomAction) => {
        const actionType = action.actionType as CustomActionType
        const hasSelectedItems =
          context.state.selectedItems && context.state.selectedItems.length > 0

        items.push(
          new ListMenuItem(action.name, action.description || action.name)
            .setIcon(action.icon || 'Robot')
            .setDisabled(!hasSelectedItems)
            .setOnClick(() => {
              if (actionType === CustomActionType.Trigger) {
                handleTriggerAction(action)
              } else if (actionType === CustomActionType.Dialog) {
                openDialog(action)
              }
            })
        )
      })
    }

    if (
      !isSingleView &&
      !context.state.isDocumentLibrary &&
      context.props.showExportButton !== false
    ) {
      const selectedCount = context.state.selectedItems?.length || 0
      const tooltipText =
        selectedCount > 0
          ? strings.DynamicList.ExportSelected
              .replace('{0}', selectedCount.toString())
              .replace('{1}', selectedCount === 1 ? '' : 's')
          : strings.DynamicList.ExportToExcel

      items.push(
        new ListMenuItem(selectedCount > 0 ? selectedCount.toString() : undefined, tooltipText)
          .setIcon('ExcelLogoInverse')
          .setOnClick(exportToExcel)
          .setDisabled(
            context.state.isExporting ||
              context.state.isLoading ||
              _.isEmpty(context.state.data?.listItems)
          )
          .setStyle({ color: '#10793F' })
      )
    }

    if (!isSingleView && context.props.showViewSelector && context.state.views?.length > 0) {
      const viewMenuItems: ListMenuItem[] = []

      if (context.state.isDocumentLibrary && context.props.showViewModeToggle !== false) {
        viewMenuItems.push(
          new ListMenuItem(strings.DynamicList.FolderView)
            .makeCheckable({
              name: 'documentViewMode',
              value: DocumentLibraryViewMode.Folders
            })
            .setOnClick(() => {
              context.setState({
                documentLibraryViewMode: DocumentLibraryViewMode.Folders
              })
            }),
          new ListMenuItem(strings.DynamicList.FlatView)
            .makeCheckable({
              name: 'documentViewMode',
              value: DocumentLibraryViewMode.Flat
            })
            .setOnClick(() => {
              context.setState({
                documentLibraryViewMode: DocumentLibraryViewMode.Flat
              })
            }),
          ListMenuItemDivider
        )
      }

      const regularViews = context.state.views.map((view) =>
        new ListMenuItem(view.isDefault ? `${view.title}${strings.DynamicList.Default}` : view.title)
          .makeCheckable({
            name: 'views',
            value: view.id
          })
          .setDisabled(true)
          .setOnClick(() => {
            onViewChange(view.id)
          })
      )

      viewMenuItems.push(...regularViews)

      items.push(
        new ListMenuItem(
          context.state.currentView?.title || strings.DynamicList.SelectView,
          strings.DynamicList.SelectViewTooltip
        )
          .setIcon(Icons.ContentView)
          .setWidth('fit-content')
          .setStyle({ minWidth: '145px' })
          .setDisabled(context.state.isChangingView)
          .setItems(viewMenuItems, checkedValues)
      )
    }

    if (context.props.showRefreshButton !== false) {
      items.push(
        new ListMenuItem(null, strings.DynamicList.Refresh).setIcon('ArrowSync').setOnClick(() => {
          context.setState({
            isRefetching: true,
            refetch: new Date().getTime()
          })
        })
      )
    }

    if (context.props.showDeleteButton !== false) {
      items.push(
        new ListMenuItem(strings.DynamicList.Delete, strings.DynamicList.DeleteSelectedItems)
          .setIcon(DeleteRegular)
          .setDisabled(
            !context.state.permissions?.canDelete ||
              !context.state.selectedItems ||
              context.state.selectedItems.length === 0
          )
          .setOnClick(() => {
            deleteItems()
          })
      )
    }

    if (!isSingleView && context.props.showFilters) {
      items.push(
        new ListMenuItem(null, strings.DynamicList.ShowHideFilters).setIcon(FilterRegular).setOnClick(() => {
          context.setState({ showFilterPanel: !context.state.showFilterPanel })
        })
      )
    }

    return items
  }, [
    isSingleView,
    context.state,
    context.props,
    checkedValues,
    onViewChange,
    deleteItems,
    exportToExcel
  ])

  const filterPanelProps = useMemo(
    () =>
      context.props.showFilters
        ? {
            isOpen: context.state.showFilterPanel,
            filters: context.state.filters || [],
            onDismiss: () => context.setState({ showFilterPanel: false }),
            onFilterChange: (column: any, selectedItems: any[]) => {
              const newActiveFilters = { ...context.state.activeFilters }

              if (selectedItems.length > 0) {
                newActiveFilters[column.fieldName] = selectedItems.map((i) => i.value)
              } else {
                delete newActiveFilters[column.fieldName]
              }

              const newFilters = context.state.filters?.map((f) => {
                if (column.key === f.column.key) {
                  return {
                    ...f,
                    items: f.items.map((item) => ({
                      ...item,
                      selected: selectedItems.some((si) => si.value === item.value)
                    }))
                  }
                }
                return f
              })

              context.setState({
                activeFilters: newActiveFilters,
                filters: newFilters
              })
            }
          }
        : null,
    [context.state, context.props]
  )

  return {
    menuItems,
    farMenuItems,
    filterPanelProps,
    customActionDialog: dialogComponent,
    toaster: (
      <>
        <IdPrefixProvider value={fluentProviderId}>
          <FluentProvider theme={customLightTheme}>
            <Toaster toasterId={toasterId} />
          </FluentProvider>
        </IdPrefixProvider>
        <IdPrefixProvider value={`${fluentProviderId}-dialog`}>
          <FluentProvider theme={customLightTheme}>
            <Toaster toasterId={dialogToasterId} />
          </FluentProvider>
        </IdPrefixProvider>
      </>
    )
  }
}
