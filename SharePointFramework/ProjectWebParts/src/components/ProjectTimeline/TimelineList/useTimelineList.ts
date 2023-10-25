import { SortDirection, TableColumnSizingOptions } from '@fluentui/react-components'
import { useContext, useState } from 'react'
import { ProjectTimelineContext } from '../context'
import { useColumns } from './useColumns'
import { useToolbarItems } from './useToolbarItems'

export function useTimelineList() {
  const context = useContext(ProjectTimelineContext)
  const columns = useColumns()
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const { menuItems, farMenuItems } = useToolbarItems(selectedItems)

  const onSelection = (_: any, data: any) => {
    const selectedItemId = Array.from(data.selectedItems)
    const selectedItems = selectedItemId.map((id) =>
      context.state.data.listItems.find((_, idx) => idx === id)
    )
    setSelectedItems(selectedItems)
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
