import { IGroup } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import sortArray from 'array-sort'
import {
  getObjectValue as get,
  ProjectColumn,
  tryParseCurrency,
  tryParseInt
} from 'pp365-shared-library'
import _ from 'underscore'
import { IPortfolioOverviewContext } from '../context'
import { IPortfolioOverviewState } from '../types'
import { applyActiveFilters } from './applyActiveFilters'
import { getBooleanDisplayValue, isBooleanColumn, normalizeBooleanValue } from './booleanColumn'

/**
 * Generates a display name for a group based on the column and its value.
 *
 * Temporary function until we have a better way to handle this. It would be
 * nice to have _one_ place to do custom rendering of different column data
 * types.
 *
 * @param column - The column used for grouping.
 * @param value - The value of the column for the group.
 *
 * @returns The display name for the group.
 */
function getGroupDisplayName(column: ProjectColumn, value: string) {
  let displayValue = value
  if (isBooleanColumn(column)) {
    return `${column.name}: ${getBooleanDisplayValue(column, value)}`
  }
  switch (column.dataType) {
    case 'number':
      displayValue = tryParseInt(value, strings.NotSet) as string
      break
    case 'currency':
      {
        displayValue = tryParseCurrency(value, strings.NotSet, 'kr', 0, 2)
      }
      break
  }
  return `${column.name}: ${displayValue}`
}

/**
 * Create groups based on `items`, `columns` and `groupBy` field.
 *
 * @param items Items
 * @param state State of `<PortfolioOverview />`
 */
function createGroups(items: any[], state: IPortfolioOverviewState) {
  if (!state.groupBy) return { items, columns: state.columns, groups: null }
  const isBooleanGroupBy = isBooleanColumn(state.groupBy)
  // For boolean columns the raw values can't be used to group by, as items
  // without a value are rendered as the false label in the grid and have to end
  // up in the same group as the explicit false values. Those items are sorted
  // by the sort column only, and then grouped by the normalized value below.
  const itemsSort: { props: string[]; opts: { reverse: boolean } } = {
    props: isBooleanGroupBy ? [] : [state.groupBy.fieldName],
    opts: { reverse: false }
  }
  if (state.sortBy) {
    itemsSort.props.push(state.sortBy.column.fieldName)
    itemsSort.opts.reverse = !state.sortBy.column.isSortedDescending
  }
  items = _.isEmpty(itemsSort.props)
    ? [...items]
    : sortArray([...items], itemsSort.props, itemsSort.opts)
  if (isBooleanGroupBy) {
    // `_.sortBy` is stable, so sorting on the normalized value after the sort
    // column keeps the items sorted within each group, while making each group
    // contiguous - which the `startIndex`/`count` based grouping below depends
    // on.
    items = _.sortBy(items, (item) =>
      normalizeBooleanValue(get<string>(item, state.groupBy.fieldName, ''))
    )
  }
  const groupNames: string[] = items.map((g) => {
    const value = get<string>(g, state.groupBy.fieldName, strings.NotSet)
    return isBooleanGroupBy ? normalizeBooleanValue(value) : value
  })
  const uniqueGroupNames: string[] = _.uniq(groupNames)
  const groups = uniqueGroupNames
    .sort((a, b) => (a > b ? 1 : -1))
    .map((name, idx) => {
      const count = groupNames.filter((n) => n === name).length
      const group: IGroup = {
        key: `Group_${idx}`,
        name: getGroupDisplayName(state.groupBy, name),
        startIndex: groupNames.indexOf(name, 0),
        count,
        isShowingAll: count === items.length,
        isDropEnabled: false,
        isCollapsed: false
      }
      return group
    })
  return { items, groups } as const
}

/**
 * Filter data based on `searchTerm` and `activeFilters`. Also, create groups based on `groupBy` field
 * using `createGroups` function.
 *
 * @param context Context of `<PortfolioOverview />`
 */
export function useFilteredData(context: IPortfolioOverviewContext) {
  let items = [...context.state.items].filter((item) => {
    return (
      context.state.columns.filter(
        (col) =>
          get(item, col?.fieldName, '').toLowerCase().indexOf(context.state.searchTerm) !== -1
      ).length > 0
    )
  })

  items = applyActiveFilters(items, context)

  return createGroups(items, context.state)
}
