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

export function useProvisionSettings() {
  const context = useContext(ProjectProvisionContext)
  const columns = useColumns()

  const columnSizingOptions = {
    title: {
      minWidth: 120,
      defaultWidth: 200
    },
    description: {
      minWidth: 220,
      defaultWidth: 400
    },
    value: {
      minWidth: 120,
      defaultWidth: 340
    },
    actions: {
      minWidth: 30,
      defaultWidth: 30
    }
  }

  const defaultSortState = { sortColumn: 'title', sortDirection: 'ascending' as SortDirection }

  const getCellFocusMode = (columnId: TableColumnId): DataGridCellFocusMode => {
    switch (columnId) {
      case 'actions':
        return 'group'
      default:
        return 'cell'
    }
  }

  /**
   * Filter settings based on the `filter` function from the `selectedVertical`
   * and the `searchTerm`. Then sort the settings based on the `sort` state.
   *
   * @param settings - settings
   */
  function filterSettings(settings: any[]) {
    return settings.filter((request) =>
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

  const settings = !context.state.loading
    ? filterSettings(context.state.settings)
    : context.state.settings

  const fluentProviderId = useId('fp-provision-settings')

  return {
    context,
    settings,
    columns,
    columnSizingOptions,
    defaultSortState,
    getCellFocusMode,
    fluentProviderId
  }
}
