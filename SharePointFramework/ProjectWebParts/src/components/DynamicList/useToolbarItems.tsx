import { useMemo, useContext, useCallback, useState } from 'react'
import { DynamicListContext } from './context'
import { ListMenuItem, ItemFieldValues, ListMenuItemDivider, customLightTheme } from 'pp365-shared-library'
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
import { useExcelExport } from './hooks'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { fetchSingleItem } from './data/fetchListData'
import * as React from 'react'
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogActions,
  Button,
  Toaster,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  ToastBody,
  FluentProvider,
  IdPrefixProvider,
  DialogTitle,
  DialogContent
} from '@fluentui/react-components'

const Icons = {
  ContentView: bundleIcon(ContentView24Filled, ContentView24Regular)
}

export function useToolbarItems(isSingleView: boolean = false, showNewButton: boolean = true) {
  const context = useContext(DynamicListContext)
  const exportToExcel = useExcelExport()
  const toasterId = useId('toaster')
  const fluentProviderId = useId('fp-dynamic-list-actions')
  const { dispatchToast } = useToastController(toasterId)
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    iframeContent: string
    actionName: string
  }>({ isOpen: false, iframeContent: '', actionName: '' })

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
    const confirmed = window.confirm(
      `Er du sikker på at du vil slette ${selectedCount} ${
        selectedCount === 1 ? 'element' : 'elementer'
      }?`
    )

    if (!confirmed) return

    const list = context.web.lists.getByTitle(context.props.listName)

    const selectedItems = context.state.selectedItems.map((id) =>
      context.state.data.listItems.find((_, idx) => idx === id)
    )

    await Promise.all(
      selectedItems.map(async (item: any) => {
        if (item?.Id) {
          await list.items.getById(item.Id).delete()
        }
      })
    )

    const deletedItemIds = new Set(selectedItems.map((item: any) => item?.Id).filter(Boolean))
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
            console.log('[useToolbarItems.uploadFiles] Uploading to folder:', {
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
            try {
              const siteId = context.props.siteId
              const siteTitle = context.props.webTitle

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
            fileName = `Nytt Word-dokument ${timestamp}.docx`
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            break
          case 'excel':
            fileName = `Ny Excel-arbeidsbok ${timestamp}.xlsx`
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            break
          case 'powerpoint':
            fileName = `Ny PowerPoint-presentasjon ${timestamp}.pptx`
            contentType =
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            break
        }

        const emptyFile = new Blob([], { type: contentType })
        let addedFile
        if (folderPath) {
          const folderServerRelativeUrl = `${listRootPath}/${folderPath}`
          console.log('[useToolbarItems.createDocument] Creating in folder:', {
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
          try {
            const siteId = context.props.siteId
            const siteTitle = context.props.webTitle

            if (siteId || siteTitle) {
              const fileItem = await addedFile.file.getItem()
              const updateProps: Record<string, any> = {}
              if (siteId) updateProps.GtSiteId = siteId
              if (siteTitle) updateProps.GtSiteTitle = siteTitle

              await fileItem.update(updateProps)
            }
          } catch (err) {
            console.error('Error setting GtSiteId/GtSiteTitle on document:', err)
          }
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
            <ToastTitle>Feil konfigurering</ToastTitle>
            <ToastBody>Hook URL er ikke konfigurert for denne handlingen.</ToastBody>
          </Toast>,
          { intent: 'error' }
        )
        return
      }

      const selectedItems = context.state.selectedItems
        .map((id) => context.state.data.listItems.find((_, idx) => idx === id))
        .filter(Boolean)

      if (selectedItems.length === 0) {
        dispatchToast(
          <Toast appearance='inverted'>
            <ToastTitle>Ingen elementer valgt</ToastTitle>
            <ToastBody>Vennligst velg minst ett element for å utføre denne handlingen.</ToastBody>
          </Toast>,
          { intent: 'warning' }
        )
        return
      }

      try {
        const payload = {
          listName: context.props.listName,
          listId: context.state.data?.listId,
          listTitle: context.state.data?.listTitle,
          webUrl: context.props.webUrl || context.props.pageContext?.web?.absoluteUrl,
          siteId: context.props.siteId,
          siteTitle: context.props.webTitle,
          selectedItems: selectedItems,
          timestamp: new Date().toISOString(),
          actionName: action.name
        }

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
            <ToastBody>Handlingen ble utført. {result.message || 'OK'}</ToastBody>
          </Toast>,
          { intent: 'success' }
        )

        // Refresh data after successful action
        context.setState({ refetch: Date.now(), selectedItems: [] })
      } catch (error) {
        console.error('Error executing trigger action:', error)
        dispatchToast(
          <Toast appearance='inverted'>
            <ToastTitle>Feil ved utføring</ToastTitle>
            <ToastBody>Kunne ikke utføre handlingen: {error.message}</ToastBody>
          </Toast>,
          { intent: 'error' }
        )
      }
    },
    [context.state, context.props, context.setState]
  )

  /**
   * Handle Dialog action type - Open dialog with iframe content
   *
   * @param action The custom action configuration
   */
  const handleDialogAction = useCallback(
    (action: ICustomAction) => {
      if (!action.iframeContent) {
        dispatchToast(
          <Toast appearance='inverted'>
            <ToastTitle>Feil konfigurering</ToastTitle>
            <ToastBody>iframe-innhold er ikke konfigurert for denne handlingen.</ToastBody>
          </Toast>,
          { intent: 'error' }
        )
        return
      }

      setDialogState({
        isOpen: true,
        iframeContent: action.iframeContent,
        actionName: action.name
      })
    },
    []
  )

  /**
   * Close the custom action dialog
   */
  const closeDialog = useCallback(() => {
    setDialogState({ isOpen: false, iframeContent: '', actionName: '' })
  }, [context.setState])

  const menuItems = useMemo<ListMenuItem[]>(() => {
    const items: ListMenuItem[] = []

    const isInFolder = context.state.isDocumentLibrary && context.state.currentFolderPath
    const showBackButton = context.state.isDrilledDown || isInFolder

    if (showBackButton) {
      items.push(
        new ListMenuItem('Tilbake', 'Tilbake til listevisning')
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
          new ListMenuItem('Word-dokument').setIcon('WordDocument').setOnClick(async () => {
            await createDocument('word')
          })
        )
      }

      if (context.props.showNewExcelButton !== false) {
        documentMenuItems.push(
          new ListMenuItem('Excel-arbeidsbok').setIcon('ExcelDocument').setOnClick(async () => {
            await createDocument('excel')
          })
        )
      }

      if (context.props.showNewPowerPointButton !== false) {
        documentMenuItems.push(
          new ListMenuItem('PowerPoint-presentasjon')
            .setIcon('PowerPointDocument')
            .setOnClick(async () => {
              await createDocument('powerpoint')
            })
        )
      }

      if (context.props.showUploadButton !== false) {
        documentMenuItems.push(
          new ListMenuItem('Last opp fil').setIcon('Upload').setOnClick(() => {
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
          new ListMenuItem('Ny', 'Opprett nytt dokument eller last opp fil')
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
        new ListMenuItem('Nytt element', 'Opprett et nytt element')
          .setDisabled(!context.state.permissions?.canAdd)
          .setIcon(AddRegular)
          .setOnClick(() => {
            const fieldValues = new ItemFieldValues()
            const fields = context.state.data?.fields || []

            context.setState({
              panel: {
                headerText: 'Nytt element',
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
        new ListMenuItem('Rediger element', 'Rediger valgt element')
          .setIcon(EditRegular)
          .setDisabled(
            !context.state.permissions?.canEdit ||
              !context.state.selectedItems ||
              context.state.selectedItems.length !== 1
          )
          .setOnClick(() => {
            const selectedItems = context.state.selectedItems.map((id) =>
              context.state.data.listItems.find((_, idx) => idx === id)
            )

            const item = _.first(selectedItems)
            if (item) {
              const fieldValues = new ItemFieldValues(item)
              context.setState({
                panel: {
                  headerText: 'Rediger element',
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
            placeholder: `Søk i ${
              context.state.currentView?.title?.toLowerCase() ||
              context.state.data?.listTitle?.toLowerCase() ||
              'liste'
            }...`,
            title: 'Søk',
            'aria-label': 'Søk',
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
    if (context.props.showCustomActions !== false && context.props.customActions && context.props.customActions.length > 0) {
      // Sort actions by order field (lower numbers first)
      const sortedActions = [...context.props.customActions].sort((a, b) => {
        const orderA = a.order ?? 100
        const orderB = b.order ?? 100
        return orderA - orderB
      })

      sortedActions.forEach((action: ICustomAction) => {
        const actionType = action.actionType as CustomActionType
        const requiresSelection = actionType === CustomActionType.Trigger
        const hasSelectedItems = context.state.selectedItems && context.state.selectedItems.length > 0

        items.push(
          new ListMenuItem(action.name, action.description || action.name)
            .setIcon(action.icon || 'Robot')
            .setDisabled(requiresSelection && !hasSelectedItems)
            .setOnClick(() => {
              if (actionType === CustomActionType.Trigger) {
                handleTriggerAction(action)
              } else if (actionType === CustomActionType.Dialog) {
                handleDialogAction(action)
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
          ? `Eksporter ${selectedCount} valgt${selectedCount === 1 ? '' : 'e'} element${
              selectedCount === 1 ? '' : 'er'
            } til Excel`
          : 'Eksporter til Excel'

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
          new ListMenuItem('Mappevisning')
            .makeCheckable({
              name: 'documentViewMode',
              value: DocumentLibraryViewMode.Folders
            })
            .setOnClick(() => {
              context.setState({
                documentLibraryViewMode: DocumentLibraryViewMode.Folders
              })
            }),
          new ListMenuItem('Flat visning')
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
        new ListMenuItem(view.isDefault ? `${view.title} (Default)` : view.title)
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
          context.state.currentView?.title || 'Velg visning',
          'Velg en visning å vise'
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
        new ListMenuItem(null, 'Oppdater').setIcon('ArrowSync').setOnClick(() => {
          context.setState({
            isRefetching: true,
            refetch: new Date().getTime()
          })
        })
      )
    }

    if (context.props.showDeleteButton !== false) {
      items.push(
        new ListMenuItem('Slett', 'Slett valgte elementer')
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
        new ListMenuItem(null, 'Vis/skjul filtre').setIcon(FilterRegular).setOnClick(() => {
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
    customActionDialog: dialogState.isOpen ? (
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <Dialog open={dialogState.isOpen} onOpenChange={(_, data) => !data.open && closeDialog()}>
            <DialogSurface style={{ maxWidth: '90vw', width: '900px', maxHeight: '90vh' }}>
              <DialogBody>
              <DialogTitle>{dialogState.actionName}</DialogTitle>
                <DialogContent style={{ marginBottom: '16px' }}>
                  <div
                    style={{ minHeight: 'fit-content' }}
                    dangerouslySetInnerHTML={{ __html: dialogState.iframeContent }}
                  />
              </DialogContent>
              </DialogBody>
              <DialogActions>
                <Button appearance="secondary" onClick={closeDialog}>
                  Avbryt
                </Button>
              </DialogActions>
            </DialogSurface>
          </Dialog>
        </FluentProvider>
      </IdPrefixProvider>
    ) : null,
    toaster: (
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <Toaster toasterId={toasterId} />
        </FluentProvider>
      </IdPrefixProvider>
    )
  }
}
