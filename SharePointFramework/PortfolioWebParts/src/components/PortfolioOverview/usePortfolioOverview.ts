import { getId, Selection } from '@fluentui/react'
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

    const onSelectionChanged = () => {
        dispatch(SELECTION_CHANGED(selection))
    }

    const selection = new Selection({ onSelectionChanged })

    const onColumnHeaderContextMenu = useColumnHeaderContextMenu()

    const onColumnHeaderClick = useColumnHeaderClick(onColumnHeaderContextMenu)

    useFetchData(contextValue)

    return {
        state,
        contextValue,
        selection,
        onColumnHeaderClick,
        onColumnHeaderContextMenu
    } as const
}
