import { get } from '@microsoft/sp-lodash-subset'
import { stringIsNullOrEmpty } from '@pnp/core'
import * as uniq from 'array-unique'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import _ from 'underscore'
import { IPortfolioOverviewContext } from '../context'
import { getBooleanDisplayValue, isBooleanColumn } from './booleanColumn'

/**
 * Returns an array of filters for the portfolio overview based on the current view and items.
 *
 * @param context - The context object containing the current view and items.
 *
 * @returns An array of filters, each containing a column and an array of filter items.
 */
export function usePortfolioOverviewFilters(context: IPortfolioOverviewContext) {
  if (!context.state.currentView) return []
  const selectedFilters = context.props.configuration.refiners.filter(
    (ref) => context.state.currentView.refiners.indexOf(ref) !== -1
  )
  const filters = selectedFilters.map((column) => {
    // Boolean columns always offer both options. Search omits properties
    // without a value, so a Yes/No column often has only one distinct value in
    // the results, which would otherwise leave the filter with a single item -
    // and `FilterPanel` hides filters with less than two items.
    if (isBooleanColumn(column)) {
      // Sorted by value to match the ordering the generic path below produces.
      const items: IFilterItemProps[] = ['0', '1'].map((value) => ({
        name: getBooleanDisplayValue(column, value),
        value
      }))
      return { column, items }
    }
    const uniqueValues = uniq(
      // eslint-disable-next-line prefer-spread
      [].concat.apply(
        [],
        context.state.items.map((i) => get(i, column.fieldName, '').split(';'))
      )
    )
    let items: IFilterItemProps[] = uniqueValues
      .filter((value: string) => !stringIsNullOrEmpty(value))
      .map((value: string) => ({ name: value, value }))
    items = items.sort((a, b) => (a.value > b.value ? 1 : -1))
    return { column, items }
  })

  const activeFilters = context.state.activeFilters
  if (!_.isEmpty(activeFilters)) {
    const filteredFields = Object.keys(activeFilters)
    filteredFields.forEach((key) => {
      filters.forEach((filter) => {
        if (filter.column.fieldName === key) {
          activeFilters[key].forEach((value) => {
            filter.items.forEach((item) => {
              if (value === item.value) {
                item.selected = true
              }
            })
          })
        }
      })
    })
  }

  return filters
}
