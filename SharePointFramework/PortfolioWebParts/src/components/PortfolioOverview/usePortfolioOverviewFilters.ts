import { get } from '@microsoft/sp-lodash-subset'
import { stringIsNullOrEmpty } from '@pnp/core'
import * as uniq from 'array-unique'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'
import _ from 'underscore'
import { IPortfolioOverviewContext } from './context'

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
              if (value === item.name) {
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
