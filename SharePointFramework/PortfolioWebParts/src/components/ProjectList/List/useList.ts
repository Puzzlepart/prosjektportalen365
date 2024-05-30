import { SortDirection, TableColumnSizingOptions } from '@fluentui/react-components'
import { useColumns } from './useColumns'

/**
 * A hook that provides the necessary data for rendering a list of projects.
 *
 * @returns An object containing the necessary data for rendering a list of projects.
 */
export function useList() {
  const columns = useColumns()

  const columnSizingOptions: TableColumnSizingOptions = columns.reduce(
    (options, col) => ({
      ...options,
      [col.columnId]: {
        defaultWidth: col.defaultWidth,
        minWidth: col.minWidth
      }
    }),
    {}
  )

  const defaultSortState = { sortColumn: 'title', sortDirection: 'ascending' as SortDirection }

  return {
    columnSizingOptions,
    columns,
    defaultSortState
  }
}
