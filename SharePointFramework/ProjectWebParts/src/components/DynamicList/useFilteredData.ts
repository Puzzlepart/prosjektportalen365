import { useContext, useMemo } from 'react'
import { DynamicListContext } from './context'
import { get } from '@microsoft/sp-lodash-subset'

/**
 * Hook to filter data based on search term and active filters
 *
 * @returns Filtered list items
 */
export function useFilteredData() {
  const context = useContext(DynamicListContext)

  return useMemo(() => {
    if (!context.state.data?.listItems) {
      return []
    }

    let items = [...context.state.data.listItems]

    // If no search term or filters, return all items
    const hasSearchTerm = context.state.searchTerm && context.state.searchTerm.trim() !== ''
    const hasFilters =
      context.state.activeFilters && Object.keys(context.state.activeFilters).length > 0

    if (!hasSearchTerm && !hasFilters) {
      return items
    }

    // Apply search filter
    if (hasSearchTerm) {
      const searchTerm = context.state.searchTerm.toLowerCase()
      items = items.filter((item) => {
        // Check if any column contains the search term
        return context.state.data.listColumns.some((col) => {
          const value = get(item, col.fieldName, '')
          return String(value).toLowerCase().indexOf(searchTerm) !== -1
        })
      })
    }

    // Apply active filters (if any)
    if (hasFilters) {
      items = items.filter((item) => {
        return Object.entries(context.state.activeFilters).every(([fieldName, filterValues]) => {
          if (!filterValues || filterValues.length === 0) return true
          const itemValue = get(item, fieldName, '')
          return filterValues.includes(String(itemValue))
        })
      })
    }

    return items
  }, [
    context.state.data?.listItems,
    context.state.data?.listColumns,
    context.state.searchTerm,
    context.state.activeFilters
  ])
}
