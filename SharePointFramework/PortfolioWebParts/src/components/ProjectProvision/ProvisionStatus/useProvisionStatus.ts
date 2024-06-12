import { DataGridCellFocusMode, SortDirection, TableColumnId } from '@fluentui/react-components'
import { useContext } from 'react'
import { ProjectProvisionContext } from '../context'
import { useColumns } from './useColumns'

export function useProvisionStatus() {
  const context = useContext(ProjectProvisionContext)
  const columns = useColumns()

  const onSelection = (_: any, data: any) => {
    const selectedItemIds = Array.from(data.selectedItems)
    context.setState({ selectedRequests: selectedItemIds })
  }

  const columnSizingOptions = {
    title: {
      minWidth: 220,
      defaultWidth: 340
    },
    created: {
      minWidth: 80,
      defaultWidth: 140
    },
    status: {
      minWidth: 220,
      defaultWidth: 220
    },
    type: {
      minWidth: 120,
      defaultWidth: 180
    },
    actions: {
      minWidth: 40,
      defaultWidth: 40
    }
  }

  const defaultSortState = { sortColumn: 'created', sortDirection: 'descending' as SortDirection }

  const getCellFocusMode = (columnId: TableColumnId): DataGridCellFocusMode => {
    switch (columnId) {
      case 'actions':
        return 'group'
      default:
        return 'cell'
    }
  }

  return {
    context,
    columns,
    columnSizingOptions,
    defaultSortState,
    onSelection,
    getCellFocusMode
  }
}
