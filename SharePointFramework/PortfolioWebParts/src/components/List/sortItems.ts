import { sortAlphabetically, sortNumerically } from 'pp365-shared-library/lib/util'

/**
 * The column rows are sorted by: its field and the type of data in it.
 */
export interface ISortableColumn {
  fieldName: string
  dataType?: string
}

/**
 * Sorts rows by a column as its type of data reads: numbers and dates by value, amounts (after
 * `kr `) and percentages by their number, anything else as text ignoring case; or in
 * `customOrder`, the order configured for the column's values (a custom sort, such as the
 * phases). The one sort of the hub's lists, `Porteføljeoversikt` and `Aggregert oversikt`, grouped
 * or not. The sort is stable, so a sort by the group column afterwards gathers each group in one
 * run and keeps this order within it.
 *
 * @param items Rows, sorted in place
 * @param column Column to sort by
 * @param ascending Whether to sort ascending (A to Å)
 * @param customOrder The column's values in the order to sort them in, if configured
 *
 * @returns `items`, sorted
 */
export function sortItems<T extends Record<string, any>>(
  items: T[],
  column: ISortableColumn,
  ascending: boolean,
  customOrder?: string[]
): T[] {
  const { fieldName } = column
  if (customOrder) {
    return items.sort((a, b) => {
      const $a = customOrder.indexOf(a[fieldName])
      const $b = customOrder.indexOf(b[fieldName])
      return ascending ? $a - $b : $b - $a
    })
  }
  switch (column.dataType) {
    case 'date':
    case 'number':
      return items.sort((a, b) => sortNumerically(a, b, ascending, fieldName))
    case 'currency':
      return items.sort((a, b) => sortNumerically(a, b, ascending, fieldName, 'kr '))
    case 'percentage':
      return items.sort((a, b) => sortNumerically(a, b, ascending, fieldName, '%'))
    default:
      return items.sort((a, b) => sortAlphabetically(a, b, ascending, fieldName))
  }
}
