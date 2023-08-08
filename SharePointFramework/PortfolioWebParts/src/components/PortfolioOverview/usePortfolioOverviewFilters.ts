import _ from 'underscore'
import * as uniq from 'array-unique'
import { stringIsNullOrEmpty } from '@pnp/core'
import { useContext } from 'react'
import { PortfolioOverviewContext } from './context'
import { get } from '@microsoft/sp-lodash-subset'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'

export function usePortfolioOverviewFilters() {
  const context = useContext(PortfolioOverviewContext)
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
