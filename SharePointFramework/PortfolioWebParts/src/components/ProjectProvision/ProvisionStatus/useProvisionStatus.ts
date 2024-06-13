import {
  DataGridCellFocusMode,
  SortDirection,
  TableColumnId,
  useId
} from '@fluentui/react-components'
import { useContext } from 'react'
import { ProjectProvisionContext } from '../context'
import { useColumns } from './useColumns'

export function useProvisionStatus(toast: any) {
  const context = useContext(ProjectProvisionContext)
  const columns = useColumns(toast)

  const columnSizingOptions = {
    displayName: {
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
      minWidth: 60,
      defaultWidth: 60
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

  const fluentProviderId = useId('fp-provision-status')

  return {
    context,
    columns,
    columnSizingOptions,
    defaultSortState,
    getCellFocusMode,
    fluentProviderId
  }
}
