import { useMemo, useContext, useCallback } from 'react'
import { DynamicListContext } from './context'
import { ListMenuItem, ItemFieldValues, isHubSite } from 'pp365-shared-library'
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
import SPDataAdapter from '../../data'
import { Web } from '@pnp/sp/webs'
import { PageContext } from '@microsoft/sp-page-context'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import _ from 'lodash'

const Icons = {
  ContentView: bundleIcon(ContentView24Filled, ContentView24Regular)
}

/**
 * Get the appropriate web instance based on webUrl and pageContext.
 *
 * Determines which SharePoint web instance to use:
 * - If no webUrl provided and current site is a hub site, returns the portal web
 * - If no webUrl provided and not a hub site, returns the current web
 * - If webUrl is provided, creates and returns a Web instance for that URL
 *
 * @param webUrl Optional web URL to target a specific site
 * @param pageContext Optional page context to determine if current site is a hub
 * @returns Web instance for the appropriate SharePoint site
 */
function getWeb(webUrl?: string, pageContext?: PageContext) {
  if (!webUrl) {
    if (pageContext && isHubSite(pageContext)) {
      return SPDataAdapter.portalDataService.web
    }
    return SPDataAdapter.sp.web
  } else {
    return Web([SPDataAdapter.sp.web, webUrl])
  }
}

export function useToolbarItems(isSingleView: boolean = false) {
  const context = useContext(DynamicListContext)

  const checkedValues = useMemo(
    () => ({
      views: [context.state.currentView?.id]
    }),
    [context.state.currentView?.id]
  )

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
   * and triggers a data refetch.
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

    const web = getWeb(context.props.webUrl, context.props.pageContext)
    const list = web.lists.getByTitle(context.props.listName)

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

    context.setState({
      selectedItems: [],
      refetch: Date.now()
    })
  }, [context.state, context.props, context.setState])

  /**
   * Dismisses the edit panel and triggers a data refetch.
   *
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

      const web = getWeb(context.props.webUrl, context.props.pageContext)
      const list = web.lists.getByTitle(context.props.listName)

      if (itemId) {
        await list.items.getById(itemId).update(properties)
      } else {
        await list.items.add(properties)
      }

      dismissPanel()
    },
    [context.props, dismissPanel]
  )

  const menuItems = useMemo<ListMenuItem[]>(() => {
    const items: ListMenuItem[] = []

    if (context.state.isDrilledDown) {
      items.push(
        new ListMenuItem('Tilbake', 'Tilbake til listevisning')
          .setIcon(ArrowLeftRegular)
          .setOnClick(() => {
            context.setState({
              isDrilledDown: false,
              selectedItem: undefined
            })
          })
      )
    }

    const hasItems = context.state.data?.listItems && context.state.data.listItems.length > 0
    const canAddItem =
      context.props.maxItems === 0 ||
      !context.state.data?.listItems ||
      context.state.data.listItems.length < context.props.maxItems

    const showNewItem = isSingleView ? !hasItems && canAddItem : canAddItem

    if (showNewItem) {
      items.push(
        new ListMenuItem('Nytt element', 'Opprett et nytt element')
          .setIcon(AddRegular)
          .setOnClick(() => {
            context.setState({
              panel: {
                headerText: 'Nytt element',
                fieldValues: new ItemFieldValues(),
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

    items.push(
      new ListMenuItem('Rediger element', 'Rediger valgt element')
        .setIcon(EditRegular)
        .setDisabled(!context.state.selectedItems || context.state.selectedItems.length !== 1)
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

    if (!isSingleView && context.props.showSearchBox) {
      items.push(
        new ListMenuItem()
          .setSearchBox({
            placeholder: `Søk i ${
              context.state.currentView?.title || context.state.data?.listTitle || 'liste'
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
  }, [isSingleView, context.state, context.props, saveItem])

  const farMenuItems = useMemo<ListMenuItem[]>(() => {
    const items: ListMenuItem[] = []

    if (!isSingleView && context.props.showViewSelector && context.state.views?.length > 0) {
      const viewMenuItems = context.state.views.map((view) =>
        new ListMenuItem(view.isDefault ? `${view.title} (Default)` : view.title)
          .makeCheckable({
            name: 'views',
            value: view.id
          })
          .setOnClick(() => {
            onViewChange(view.id)
          })
      )

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
    items.push(
      new ListMenuItem(null, 'Oppdater').setIcon('ArrowSync').setOnClick(() => {
        context.setState({
          isRefetching: true,
          refetch: new Date().getTime()
        })
      }),
      new ListMenuItem('Slett', 'Slett valgte elementer')
        .setIcon(DeleteRegular)
        .setDisabled(!context.state.selectedItems || context.state.selectedItems.length === 0)
        .setOnClick(() => {
          deleteItems()
        })
    )

    if (!isSingleView && context.props.showFilters) {
      items.push(
        new ListMenuItem('Filter', 'Vis/skjul filtre').setIcon(FilterRegular).setOnClick(() => {
          context.setState({ showFilterPanel: !context.state.showFilterPanel })
        })
      )
    }

    return items
  }, [isSingleView, context.state, context.props, checkedValues, onViewChange, deleteItems])

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
    filterPanelProps
  }
}
