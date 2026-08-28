import { getObjectValue as get } from 'pp365-shared-library'
import _ from 'underscore'
import { IPortfolioOverviewContext } from '../context'
import { isBooleanColumn, normalizeBooleanValue } from './booleanColumn'

/**
 * Filters `items` by the currently active filters.
 *
 * Shared by the list itself and the Excel export, so that the two always agree
 * on which rows a filter matches. Note that the search term is applied by the
 * list only, so an active search is still not reflected in the export.
 *
 * Boolean columns are compared on the normalized value, so that items where
 * search returned no value match the false option - the same way they're
 * rendered as the false label in the list.
 *
 * @param items Items to filter
 * @param context Context of `<PortfolioOverview />`
 */
export function applyActiveFilters(items: any[], context: IPortfolioOverviewContext) {
  const activeFilters = context.state.activeFilters ?? {}
  // The refiners are looked up first, as the persisted columns in
  // `state.columns` are stripped down and don't carry the data type.
  const columns = [
    ...(context.props.configuration?.refiners ?? []),
    ...(context.state.columns ?? [])
  ]
  return Object.keys(activeFilters).reduce((arr, key) => {
    const column = _.find(columns, (col) => col?.fieldName === key)
    const isBoolean = isBooleanColumn(column)
    return arr.filter((item) => {
      const value = isBoolean
        ? normalizeBooleanValue(get<string>(item, key, ''))
        : get<string>(item, key, '')
      return activeFilters[key].some((filterValue) =>
        isBoolean ? value === filterValue : value.indexOf(filterValue) !== -1
      )
    })
  }, items)
}
