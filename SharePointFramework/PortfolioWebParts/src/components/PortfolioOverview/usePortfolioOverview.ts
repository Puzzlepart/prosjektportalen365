import { getId, Selection } from '@fluentui/react'
import { useMemo, useReducer } from 'react'
import { IPortfolioOverviewContext } from './context'
import createReducer, { initState } from './reducer'
import { IPortfolioOverviewProps } from './types'
import { useColumnHeaderClick } from './useColumnHeaderClick'
import { useColumnHeaderContextMenu } from './useColumnHeaderContextMenu'
import { useFetchData } from './useFetchData'
import { usePersistedColumns } from './usePersistedColumns'

/**
 * Component logic hook for `PortfolioOverview` component.
 *
 * - Handles state using `useReducer` and our custom `reducer` function
 * - Handles selection changes using `Selection` from `@fluentui/react`
 * - Fetches initial data using `useFetchInitialData`
 */
export function usePortfolioOverview(props: IPortfolioOverviewProps) {
  const { value: placeholderColumns } = usePersistedColumns(props)
  const reducer = useMemo(() => createReducer({ props, placeholderColumns }), [])
  const [state, dispatch] = useReducer(reducer, initState({ props, placeholderColumns }))

  const contextValue: IPortfolioOverviewContext = {
    props,
    state,
    dispatch,
    layerHostId: getId('layerHost')
  }

  const selection = new Selection({})

  const getFilters = () => {
    // TODO: Implement
    return []
  }

  const onColumnHeaderContextMenu = useColumnHeaderContextMenu()

  const onColumnHeaderClick = useColumnHeaderClick(onColumnHeaderContextMenu)

  const onFilterChange = () => {
    // TODO: Implement
  }

  useFetchData(contextValue)

  return {
    state,
    contextValue,
    selection,
    getFilters,
    onColumnHeaderClick,
    onColumnHeaderContextMenu,
    onFilterChange
  } as const
}
