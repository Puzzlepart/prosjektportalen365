import { getId, Selection } from '@fluentui/react'
import { useMemo, useReducer } from 'react'
import createReducer, {
    initState
} from './reducer'
import { IPortfolioOverviewProps } from './types'
import { useFetchInitialData } from './useFetchInitialData'
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

    const selection = new Selection({})

    const getFilters = () => {
        // TODO: Implement
        return []
    }

    const onColumnHeaderClick = () => {
        // TODO: Implement
    }

    const onColumnHeaderContextMenu = () => {
        // TODO: Implement
    }

    const onFilterChange = () => {
        // TODO: Implement
    }

    useFetchInitialData(props, dispatch)

    return {
        state,
        dispatch,
        selection,
        getFilters,
        onColumnHeaderClick,
        onColumnHeaderContextMenu,
        onFilterChange,
        layerHostId: getId('layerHost'),
    } as const
}
