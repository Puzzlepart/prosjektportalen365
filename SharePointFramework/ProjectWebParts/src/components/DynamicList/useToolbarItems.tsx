import * as React from 'react'
import { useMemo, useContext, useCallback } from 'react'
import { DynamicListContext } from './context'
import { ListMenuItem, ItemFieldValues, ListMenuItemDivider } from 'pp365-shared-library'
import {
  ArrowSyncRegular,
  FilterRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  ContentView24Filled,
  ContentView24Regular,
  bundleIcon
} from '@fluentui/react-icons'
import SPDataAdapter from '../../data'
import _ from 'lodash'

const Icons = {
  ContentView: bundleIcon(ContentView24Filled, ContentView24Regular)
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
   * Handle view selection change
   */
  const onViewChange = useCallback(async (viewId: string) => {
    if (viewId === context.state.currentView?.id) return

    context.setState({ isChangingView: true })

    // Find the selected view
    const selectedView = context.state.views?.find((v) => v.id === viewId)
    if (!selectedView) return

    // Update current view and trigger refetch with new view
    // This will cause the data to be refetched with the new view's fields
    context.setState({
      currentView: selectedView,
      isChangingView: false
    })

    // Trigger refetch after state is updated
    setTimeout(() => {
      context.setState({ refetch: Date.now() })
    }, 0)
  }, [context.state.currentView?.id, context.state.views, context.setState])

  /**
   * Delete selected items
   */
  const deleteItems = useCallback(async () => {
    if (!context.props.listName) return

    const web = SPDataAdapter.sp.web
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
  }, [context.props.listName, context.state.selectedItems, context.state.data.listItems, context.setState])

  /**
   * Dismisses the panel and refetches data
   */
  const dismissPanel = useCallback(() => {
    context.setState({
      selectedItems: [],
      refetch: Date.now(),
      panel: null
    })
  }, [context.setState])

  /**
   * Adds or updates an item in the list
   */
  const saveItem = useCallback(async (itemId: number | null, properties: Record<string, any>) => {
    if (!context.props.listName) return

    const web = SPDataAdapter.sp.web
    const list = web.lists.getByTitle(context.props.listName)

    if (itemId) {
      await list.items.getById(itemId).update(properties)
    } else {
      await list.items.add(properties)
    }

    dismissPanel()
  }, [context.props.listName, dismissPanel])

  const menuItems = useMemo<ListMenuItem[]>(() => {
    const items: ListMenuItem[] = []

    const hasItems = context.state.data?.listItems && context.state.data.listItems.length > 0
    const canAddItem =
      context.props.maxItems === 0 ||
      !context.state.data?.listItems ||
      context.state.data.listItems.length < context.props.maxItems

    // In single view, only show New Item if there are no items
    const showNewItem = isSingleView ? !hasItems && canAddItem : canAddItem

    if (showNewItem) {
      items.push(
        new ListMenuItem('New Item', 'Create a new item').setIcon(AddRegular).setOnClick(() => {
          context.setState({
            panel: {
              headerText: 'New Item',
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
      new ListMenuItem('Edit Item', 'Edit selected item')
        .setIcon(EditRegular)
        .setDisabled(context.state.selectedItems.length !== 1)
        .setOnClick(() => {
          const selectedItems = context.state.selectedItems.map((id) =>
            context.state.data.listItems.find((_, idx) => idx === id)
          )

          const item = _.first(selectedItems)
          if (item) {
            const fieldValues = new ItemFieldValues(item)
            context.setState({
              panel: {
                headerText: 'Edit Item',
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

    // Hide search in single view
    if (!isSingleView && context.props.showSearchBox) {
      items.push(
        new ListMenuItem().setSearchBox({
          placeholder: `Search in ${context.props.viewName || context.state.data?.listTitle || 'list'}...`,
          title: 'Search',
          'aria-label': 'Search',
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
  }, [
    isSingleView,
    context.props.showFilters,
    context.props.showSearchBox,
    context.props.showViewSelector,
    context.props.maxItems,
    context.props.viewName,
    context.state.showFilterPanel,
    context.state.data?.listItems?.length,
    context.state.data?.listTitle,
    context.state.selectedItems,
    context.state.searchTerm,
    context.state.views,
    context.state.currentView,
    context.state.isChangingView,
    context.state.isLoading,
    checkedValues,
    saveItem
  ])

  const farMenuItems = useMemo<ListMenuItem[]>(() => {
    const items: ListMenuItem[] = []

    // Hide view selector in single view
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
          context.state.currentView?.title || 'Select View',
          'Select a view to display'
        )
          .setIcon(Icons.ContentView)
          .setWidth('fit-content')
          .setStyle({ minWidth: '145px' })
          .setDisabled(context.state.isChangingView)
          .setItems(viewMenuItems, checkedValues)
      )
    }

    items.push(
      new ListMenuItem(null, 'Refresh').setIcon('ArrowSync').setOnClick(() => {
        context.setState({
          isRefetching: true,
          refetch: new Date().getTime()
        })
      }),
      new ListMenuItem('Delete', 'Delete selected items')
        .setIcon(DeleteRegular)
        .setDisabled(context.state.selectedItems.length === 0)
        .setOnClick(() => {
          deleteItems()
        })
    )

    // Hide filters in single view
    if (!isSingleView && context.props.showFilters) {
      items.push(
        new ListMenuItem('Filter', 'Toggle filters').setIcon(FilterRegular).setOnClick(() => {
          context.setState({ showFilterPanel: !context.state.showFilterPanel })
        })
      )
    }

    return items
  }, [
    isSingleView,
    context.props.showFilters,
    context.props.showViewSelector,
    context.state.showFilterPanel,
    context.state.selectedItems,
    context.state.data?.listItems?.length,
    context.state.views,
    context.state.currentView,
    context.state.isChangingView,
    checkedValues,
    onViewChange,
    deleteItems
  ])

  return {
    menuItems,
    farMenuItems
  }
}
