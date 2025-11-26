import * as React from 'react'
import { useMemo, useContext, createElement } from 'react'
import { DynamicListContext } from './context'
import { ListMenuItem, ItemFieldValues } from 'pp365-shared-library'
import { ArrowSyncRegular, FilterRegular, AddRegular, EditRegular, DeleteRegular } from '@fluentui/react-icons'
import { SearchBox } from '@fluentui/react-components'
import SPDataAdapter from '../../data'
import _ from 'lodash'

export function useToolbarItems() {
  const context = useContext(DynamicListContext)

  /**
   * Delete selected items
   */
  const deleteItems = async () => {
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
  }

  /**
   * Dismisses the panel and refetches data
   */
  const dismissPanel = () => {
    context.setState({
      selectedItems: [],
      refetch: Date.now(),
      panel: null
    })
  }

  /**
   * Adds or updates an item in the list
   */
  const saveItem = async (itemId: number | null, properties: Record<string, any>) => {
    if (!context.props.listName) return

    const web = SPDataAdapter.sp.web
    const list = web.lists.getByTitle(context.props.listName)

    if (itemId) {
      // Update existing item
      await list.items.getById(itemId).update(properties)
    } else {
      // Create new item
      await list.items.add(properties)
    }

    dismissPanel()
  }

  const menuItems = useMemo<ListMenuItem[]>(() => {
    const items: ListMenuItem[] = []

    // Add new item button (if maxItems allows)
    const canAddItem =
      context.props.maxItems === 0 ||
      !context.state.data?.listItems ||
      context.state.data.listItems.length < context.props.maxItems

    if (canAddItem) {
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

    // Edit item button
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

    // Add SearchBox to toolbar if enabled
    if (context.props.showSearchBox) {
      items.push(
        new ListMenuItem('', '').setCustomRender(() =>
          createElement(SearchBox, {
            placeholder: `Search in ${context.props.viewName || context.state.data?.listTitle || 'list'}...`,
            value: context.state.searchTerm || '',
            onChange: (_, data) => context.setState({ searchTerm: data?.value || '' }),
            contentAfter: createElement(
              'span',
              { style: { fontSize: '12px', color: '#666', marginLeft: '8px' } },
              `${context.state.data?.listItems?.filter((item) => {
                if (!context.state.searchTerm || context.state.searchTerm.trim() === '') return true
                const searchTerm = context.state.searchTerm.toLowerCase()
                return context.state.data.listColumns.some((col) => {
                  const value = item[col.fieldName] || ''
                  return String(value).toLowerCase().indexOf(searchTerm) !== -1
                })
              }).length || 0} results`
            )
          })
        )
      )
    }

    // Refresh button
    items.push(
      new ListMenuItem('Refresh', 'Refresh the list').setIcon(ArrowSyncRegular).setOnClick(() => {
        context.setState({ refetch: Date.now() })
      })
    )

    // Filter button (if enabled)
    if (context.props.showFilters) {
      items.push(
        new ListMenuItem('Filter', 'Toggle filters').setIcon(FilterRegular).setOnClick(() => {
          context.setState({ showFilterPanel: !context.state.showFilterPanel })
        })
      )
    }

    return items
  }, [
    context.props.showFilters,
    context.props.showSearchBox,
    context.props.maxItems,
    context.props.viewName,
    context.state.showFilterPanel,
    context.state.data?.listItems?.length,
    context.state.data?.listTitle,
    context.state.selectedItems,
    context.state.searchTerm
  ])

  const farMenuItems = useMemo<ListMenuItem[]>(() => {
    const items: ListMenuItem[] = []

    // Delete button
    items.push(
      new ListMenuItem('Delete', 'Delete selected items')
        .setIcon(DeleteRegular)
        .setDisabled(context.state.selectedItems.length === 0)
        .setOnClick(() => {
          deleteItems()
        })
    )

    // Show item count and limit
    if (context.props.maxItems > 0 && context.state.data?.listItems) {
      const itemCount = context.state.data.listItems.length
      items.push(
        new ListMenuItem(
          `${itemCount} of ${context.props.maxItems} item${context.props.maxItems !== 1 ? 's' : ''}`
        ).setDisabled(true)
      )
    }

    // Show selected count (for multi-select mode)
    if (context.state.selectedItems?.length > 0) {
      items.push(
        new ListMenuItem(`${context.state.selectedItems.length} selected`).setDisabled(true)
      )
    }

    return items
  }, [context.state.selectedItems, context.state.data?.listItems?.length, context.props.maxItems])

  return {
    menuItems,
    farMenuItems
  }
}
