import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { getObjectValue as get } from 'pp365-shared-library/lib/util/getObjectValue'
import { useMemo } from 'react'
import { IPortfolioAggregationContext } from './context'
import { searchItem } from './search'
import _ from 'lodash'

/**
 * Filter items by active filters.
 *
 * @param items Items
 * @param activeFilters Active filters
 */
const filterItems = (
  items: IFilterItemProps[],
  activeFilters: Record<string, string[]>
): Record<string, any>[] => {
  return Object.keys(activeFilters).reduce((arr, key) => {
    return _.filter(arr, (f) => {
      const colValue = get<string>(f, key, '')
      return _.some(activeFilters[key], (v) => colValue.indexOf(v) !== -1)
    })
  }, items)
}

/**
 * Returns the list items and columns for the Portfolio Aggregation component filtered
 * by the active filters and search term.
 *
 * @param context Context for the Portfolio Aggregation component
 */
export function usePortfolioAggregationFilteredItems({ state }: IPortfolioAggregationContext) {
  return useMemo(() => {
    const filteredItems = filterItems(state.items, state.activeFilters)
    return filteredItems.filter((i) => searchItem(i, state.searchTerm, state.columns))
  }, [state.searchTerm, state.items, state.activeFilters])
}
