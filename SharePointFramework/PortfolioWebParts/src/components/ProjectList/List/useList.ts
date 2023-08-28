import { SortDirection } from '@fluentui/react-components'
import { useColumns } from './useColumns'

/**
 * A hook that provides the necessary data for rendering a list of projects.
 *
 * @returns An object containing the necessary data for rendering a list of projects.
 */
export function useList() {
  const columns = useColumns()

  const columnSizingOptions = columns.reduce(
    (options, col) => (
      (options[col.columnId] = {
        defaultWidth: col.defaultWidth,
        minWidth: col.minWidth
      }),
      options
    ),
    {}
  )

  const defaultSortState = { sortColumn: 'title', sortDirection: 'ascending' as SortDirection }

  return { columnSizingOptions, columns, defaultSortState } as const
}
