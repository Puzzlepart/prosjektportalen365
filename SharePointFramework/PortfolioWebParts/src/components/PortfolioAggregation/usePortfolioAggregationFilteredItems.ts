import { IFilterItemProps, IFilterProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { getObjectValue as get } from 'pp365-shared-library/lib/util/getObjectValue'
import { useMemo } from 'react'
import { IPortfolioAggregationContext } from './context'
import { searchItem } from './search'
import _ from 'lodash'

/**
 * Reads the value used when matching an active filter against an item. For
 * project refiners (resolved via the column's `internalName`) the joined
 * `__project.data` is checked first — this is the same priority used when the
 * filter panel's unique values are built. Falls back to the search-result
 * value via `fieldName` so filters for fields without a managed property
 * still apply correctly.
 */
const readFilterValue = (item: any, key: string, filterColumn?: any): string => {
  const internalName: string | undefined = filterColumn?.internalName
  if (internalName && item?.__projectRefinerValues) {
    const value = item.__projectRefinerValues[internalName]
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) return value.join(';')
      return String(value)
    }
  }
  return get<string>(item, key, '')
}

/**
 * Filter items by active filters.
 *
 * @param items Items
 * @param activeFilters Active filters
 * @param filters Filter column metadata (for `internalName` lookup)
 */
const filterItems = (
  items: IFilterItemProps[],
  activeFilters: Record<string, string[]>,
  filters: IFilterProps[]
): Record<string, any>[] => {
  return Object.keys(activeFilters).reduce((arr, key) => {
    const filterColumn = filters.find((f) => f.column.key === key || f.column.fieldName === key)
      ?.column
    return _.filter(arr, (f) => {
      const colValue = readFilterValue(f, key, filterColumn)
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
    const filteredItems = filterItems(state.items, state.activeFilters, state.filters ?? [])
    return filteredItems.filter((i) => searchItem(i, state.searchTerm, state.columns))
  }, [state.searchTerm, state.items, state.activeFilters, state.filters])
}
