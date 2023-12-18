import { SortDirection, TableColumnSizingOptions } from '@fluentui/react-components'
import { useContext } from 'react'
import { ProjectTimelineContext } from '../context'
import { useColumns } from './useColumns'
import { useToolbarItems } from './useToolbarItems'

export function useTimelineList() {
  const context = useContext(ProjectTimelineContext)
  const columns = useColumns()
  const { menuItems, farMenuItems } = useToolbarItems()

  const onSelection = (_: any, data: any) => {
    const selectedItemIds = Array.from(data.selectedItems)
    context.setState({ selectedItems: selectedItemIds })
  }

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

  const defaultSortState = { sortColumn: 'Title', sortDirection: 'ascending' as SortDirection }

  return {
    columns,
    menuItems,
    farMenuItems,
    columnSizingOptions,
    defaultSortState,
    onSelection
  }
}
