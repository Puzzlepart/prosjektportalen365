import { IGroup } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import sortArray from 'array-sort'
import { getObjectValue as get } from 'pp365-shared-library'
import { ProjectColumn } from 'pp365-shared-library/lib/models'
import _ from 'underscore'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'

/**
 * Create groups based on `items`, `columns` and `groupBy` field.
 *
 * @param items Items
 * @param columns Columns
 * @param state State of `<PortfolioOverview />`
 */
function createGroups(items: any[], columns: ProjectColumn[], state: IPortfolioOverviewState) {
  if (!state.groupBy) return { items, columns, groups: null }
  const itemsSort = { props: [state.groupBy.fieldName], opts: { reverse: false } }
  if (state.sortBy) {
    itemsSort.props.push(state.sortBy.column.fieldName)
    itemsSort.opts.reverse = !state.sortBy.column.isSortedDescending
  }
  items = sortArray([...items], itemsSort.props, itemsSort.opts)
  const groupNames: string[] = items.map((g) =>
    get<string>(g, state.groupBy.fieldName, strings.NotSet)
  )
  const uniqueGroupNames: string[] = _.uniq(groupNames)
  const groups = uniqueGroupNames
    .sort((a, b) => (a > b ? 1 : -1))
    .map((name, idx) => {
      const count = groupNames.filter((n) => n === name).length
      const group: IGroup = {
        key: `Group_${idx}`,
        name: `${state.groupBy.name}: ${name}`,
        startIndex: groupNames.indexOf(name, 0),
        count,
        isShowingAll: count === items.length,
        isDropEnabled: false,
        isCollapsed: false
      }
      return group
    })
  return { items, columns, groups }
}

/**
 * Filter data based on `searchTerm` and `activeFilters`. Also, create groups based on `groupBy` field
 * using `createGroups` function.
 *
 * @param props Props of `<PortfolioOverview />`
 * @param state State of `<PortfolioOverview />`
 */
export function useFilteredData(props: IPortfolioOverviewProps, state: IPortfolioOverviewState) {
  let columns = [...state.columns]
  let items = [...state.items].filter((item) => {
    return (
      columns.filter(
        (col) => get(item, col?.fieldName, '').toLowerCase().indexOf(state.searchTerm) !== -1
      ).length > 0
    )
  })

  items = Object.keys(state.activeFilters)
    .filter((key) => key !== 'SelectedColumns')
    .reduce((arr, key) => {
      return arr.filter((i) => {
        const colValue = get<string>(i, key, '')
        return (
          state.activeFilters[key].filter((filterValue) => colValue.indexOf(filterValue) !== -1)
            .length > 0
        )
      })
    }, items)
  if (state.activeFilters.SelectedColumns) {
    columns = props.configuration.columns.filter(
      (col) => state.activeFilters.SelectedColumns.indexOf(col.fieldName) !== -1
    )
  }

  return createGroups(items, columns, state)
}
