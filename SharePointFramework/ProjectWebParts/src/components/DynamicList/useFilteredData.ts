import { useContext, useMemo } from 'react'
import { DynamicListContext, IDynamicListContext } from './context'
import { get } from '@microsoft/sp-lodash-subset'

/**
 * The rows the list shows: those matching the search term in any column, narrowed by the active
 * filters, every filter having to match. Shared by the list and the Excel export, so that the
 * export holds what is shown.
 *
 * @param state State of the dynamic list
 */
export function filterListItems(state: IDynamicListContext['state']) {
  if (!state.data?.listItems) {
    return []
  }

  let items = [...state.data.listItems]

  const hasSearchTerm = state.searchTerm && state.searchTerm.trim() !== ''
  const hasFilters = state.activeFilters && Object.keys(state.activeFilters).length > 0

  if (!hasSearchTerm && !hasFilters) {
    return items
  }

  if (hasSearchTerm) {
    const searchTerm = state.searchTerm.toLowerCase()
    items = items.filter((item) => {
      return state.data.listColumns.some((col) => {
        const value = get(item, col.fieldName, '')
        return String(value).toLowerCase().indexOf(searchTerm) !== -1
      })
    })
  }

  if (hasFilters) {
    items = items.filter((item) => {
      return Object.entries(state.activeFilters).every(([fieldName, filterValues]) => {
        if (!filterValues || filterValues.length === 0) return true
        const itemValue = get(item, fieldName, '')
        return filterValues.includes(String(itemValue))
      })
    })
  }

  return items
}

/**
 * Hook to filter data based on search term and active filters (see `filterListItems`)
 *
 * @returns Filtered list items
 */
export function useFilteredData() {
  const context = useContext(DynamicListContext)

  return useMemo(
    () => filterListItems(context.state),
    [
      context.state.data?.listItems,
      context.state.data?.listColumns,
      context.state.searchTerm,
      context.state.activeFilters
    ]
  )
}
