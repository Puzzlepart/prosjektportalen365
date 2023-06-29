import _ from 'lodash'
import { IColumn } from '@fluentui/react/lib/DetailsList'
import { getObjectValue as get } from 'pp365-shared-library/lib/helpers'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'

/**
 * Filter item
 *
 * @param items Items
 * @param columns Columns
 * @param activeFilters Active filters
 */
export const filterItems = (items: IFilterItemProps[], columns: IColumn[], activeFilters: any) => {
  items = Object.keys(activeFilters)
    .filter((key) => key !== 'SelectedColumns')
    .reduce((arr, key) => {
      return arr.filter((i) => {
        const colValue = get<string>(i, key, '')
        return (
          activeFilters[key].filter((filterValue) => colValue.indexOf(filterValue) !== -1).length >
          0
        )
      })
    }, items)

  if (activeFilters.SelectedColumns) {
    columns = columns.filter((col) =>
      _.some(activeFilters.SelectedColumns, (c) => c === col.fieldName)
    )
  }
  return { columns, items } as const
}
