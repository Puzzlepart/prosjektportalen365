import { IFilterItemProps, IFilterProps } from 'components/FilterPanel'
import _, { cloneDeep } from 'lodash'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import strings from 'PortfolioWebPartsStrings'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'

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
          activeFilters[key].filter((filterValue) => colValue.indexOf(filterValue) !== -1)
            .length > 0
        )
      })
    }, items)
  if (activeFilters.SelectedColumns) {
    columns = columns.filter(
      (col) => _.some(activeFilters.SelectedColumns, (c) => c === col.fieldName)
    )
  }
  return columns
}

export const getFilters = (columns: IColumn[]) => {
  return [
    {
      column: {
        key: 'SelectedColumns',
        fieldName: 'SelectedColumns',
        name: strings.SelectedColumnsLabel,
        minWidth: 0
      },
      items: columns.map((col) => ({
        name: col.name,
        value: col.fieldName,
        selected: _.some(columns, (c) => c.fieldName === col.fieldName)
      })),
      defaultCollapsed: false
    }
  ]
}
