import { SortDirection, useId } from '@fluentui/react-components'
import { useContext } from 'react'
import { ProjectTimelineContext } from '../context'
import { useColumns } from './useColumns'
import { useToolbarItems } from './useToolbarItems'

export function useTimelineList() {
  const context = useContext(ProjectTimelineContext)
  const columns = useColumns()
  const { menuItems, farMenuItems } = useToolbarItems()

  const onSelection = (selectedItems: (string | number)[]) => {
    context.setState({ selectedItems })
  }

  const defaultSortState = { sortColumn: 'Title', sortDirection: 'ascending' as SortDirection }
  const fluentProviderId = useId('fp-timeline-list')

  return {
    columns,
    menuItems,
    farMenuItems,
    defaultSortState,
    onSelection,
    fluentProviderId
  }
}
