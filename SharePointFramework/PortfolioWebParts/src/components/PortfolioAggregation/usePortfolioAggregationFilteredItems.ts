import { useMemo } from 'react'
import { IPortfolioAggregationContext } from './context'
import { filterItems } from './filter'
import { searchItem } from './search'

/**
 * Returns the list items and columns for the Portfolio Aggregation component filtered
 * by the active filters and search term.
 *
 * @param context Context for the Portfolio Aggregation component
 */
export function usePortfolioAggregationFilteredItems({ state }: IPortfolioAggregationContext) {
  return useMemo(() => {
    const filteredItems = filterItems(state.items, state.columns, state.activeFilters)
    return {
      listItems: filteredItems.items.filter((i) => searchItem(i, state.searchTerm, state.columns)),
      columns: filteredItems.columns
    }
  }, [
    state.columnAddedOrUpdated,
    state.searchTerm,
    state.items,
    state.activeFilters,
    state.columns
  ])
}
