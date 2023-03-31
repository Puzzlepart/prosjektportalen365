import { getId, Selection } from '@fluentui/react'
import { useMemo, useReducer } from 'react'
import createReducer,{
    initState
} from './reducer'
import { IPortfolioOverviewProps } from './types'
import { useFetchInitialData } from './useFetchInitialData'

/**
 * Component logic hook for `PortfolioOverview` component.
 */
export function usePortfolioOverview(props: IPortfolioOverviewProps) {
    const reducer = useMemo(() => createReducer(props), [])
    const [state, dispatch] = useReducer(reducer, initState(props))

    const selection = new Selection({})

    const getFilteredData = () => {
        // TODO: Implement
        return { items: [], columns: [], groups: [] }
    }

    const getFilters = () => {
        // TODO: Implement
        return []
    }

    const onRenderDetailsHeader = () => {
        // TODO: Implement
        return null
    }

    const onColumnHeaderClick = () => {
        // TODO: Implement
    }

    const onColumnHeaderContextMenu = () => {
        // TODO: Implement
    }

    const onChangeView = () => {
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
        getFilteredData,
        getFilters,
        onRenderDetailsHeader,
        onColumnHeaderClick,
        onColumnHeaderContextMenu,
        onChangeView,
        onFilterChange,
        layerHostId: getId('layerHost'),
    } as const
}
