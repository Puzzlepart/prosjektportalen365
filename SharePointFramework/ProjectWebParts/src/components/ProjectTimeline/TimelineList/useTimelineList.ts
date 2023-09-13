import { useContext, useState } from 'react'
import { ProjectTimelineContext } from '../context'
import { useToolbarItems } from '../TimelineList/ToolbarItems/useToolbarItems'
import { DataGridProps, SortDirection, TableColumnSizingOptions } from '@fluentui/react-components'
import { useColumns } from './useColumns'

export function useTimelineList(): any {
  const context = useContext(ProjectTimelineContext)
  const columns = useColumns()
  const [selectedItems, setSelectedItems] = useState<any[]>([])

  const onSelection: DataGridProps['onSelectionChange'] = (e, data) => {
    const selectedItemId = Array.from(data.selectedItems)
    // find all items that are selected by checking the index of the selected item in the list of all items
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
  const { menuItems, farMenuItems } = useToolbarItems(
    context.props,
    context.setState,
    selectedItems
  )

  return {
    columns,
    menuItems,
    farMenuItems,
    columnSizingOptions,
    defaultSortState,
    onSelection
  } as const
}
