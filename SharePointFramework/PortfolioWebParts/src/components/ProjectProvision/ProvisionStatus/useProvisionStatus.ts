import {
  DataGridCellFocusMode,
  SortDirection,
  TableColumnId,
  useId
} from '@fluentui/react-components'
import { useContext } from 'react'
import { useColumns } from './useColumns'
import _ from 'underscore'
import { ProjectProvisionContext } from '../context'

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

  /**
   * Filter requests based on the `filter` function from the `selectedVertical`
   * and the `searchTerm`. Then sort the requests based on the `sort` state.
   *
   * @param requests - requests
   */
  function filterRequests(requests: any[]) {
    return requests.filter((request) =>
      _.any(Object.values(request), (value) => {
        if (Array.isArray(value) && value.length > 0) {
          return value.join(', ').toLowerCase().includes(context.state.searchTerm.toLowerCase())
        } else if (typeof value === 'object' && value !== null) {
          return Object.values(value)
            .join(', ')
            .toLowerCase()
            .includes(context.state.searchTerm.toLowerCase())
        } else if (typeof value === 'string') {
          return value.toLowerCase().includes(context.state.searchTerm.toLowerCase())
        }
        return false
      })
    )
  }

  const requests = !context.state.loading
    ? filterRequests(context.state.requests)
    : context.state.requests

  const fluentProviderId = useId('fp-provision-status')

  return {
    context,
    requests,
    columns,
    columnSizingOptions,
    defaultSortState,
    getCellFocusMode,
    fluentProviderId
  }
}
