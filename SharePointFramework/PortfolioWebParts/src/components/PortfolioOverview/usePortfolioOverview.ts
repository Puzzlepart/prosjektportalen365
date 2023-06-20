import { Selection } from '@fluentui/react'
import { useId } from '@fluentui/react-hooks'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { useMemo, useReducer } from 'react'
import { IPortfolioOverviewContext } from './context'
import createReducer, { initState, SELECTION_CHANGED } from './reducer'
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
 * - Configures the `ExcelExportService` from `pp365-shared`
 * - Handles column header click using `useColumnHeaderClick`
 * - Handles column header context menu using `useColumnHeaderContextMenu`
 * - Handles column persistence using `usePersistedColumns`
 */
export function usePortfolioOverview(props: IPortfolioOverviewProps) {
  const [placeholderColumns] = usePersistedColumns(props)
  const reducer = useMemo(
    () => createReducer({ props, placeholderColumns }),
    []
  )
  const [state, dispatch] = useReducer(
    reducer,
    initState({ props, placeholderColumns })
  )

  const layerHostId = useId('layerHost')

  const contextValue: IPortfolioOverviewContext = {
    props,
    state,
    dispatch,
    layerHostId
  }

  const onSelectionChanged = () => {
    dispatch(SELECTION_CHANGED(selection))
  }

  const selection = new Selection({ onSelectionChanged })

  const onColumnHeaderContextMenu = useColumnHeaderContextMenu(contextValue)

  const onColumnHeaderClick = useColumnHeaderClick(onColumnHeaderContextMenu)

  useFetchData(contextValue)

  ExcelExportService.configure({ name: props.title })

  return {
    state,
    contextValue,
    selection,
    onColumnHeaderClick,
    onColumnHeaderContextMenu
  } as const
}
