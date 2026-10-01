import { SortDirection } from '@fluentui/react-components'
import { useColumns } from './useColumns'

/**
 * The columns and default sort for the project list's list view. Sizing comes from the columns'
 * own widths, which `DataGridList` reads.
 */
export function useList() {
  const columns = useColumns()
  const defaultSortState = { sortColumn: 'title', sortDirection: 'ascending' as SortDirection }
  return { columns, defaultSortState }
}
