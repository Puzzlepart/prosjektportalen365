import { getId, Selection } from '@fluentui/react'
import { useState } from 'react'
import { IPortfolioOverviewState } from './types'

/**
 * Component logic hook for `PortfolioOverview` component.
 */
export function usePortfolioOverview() {
    const [state, setState] = useState<IPortfolioOverviewState>({
        loading: false,
        isCompact: false,
        searchTerm: '',
        activeFilters: {},
        items: [],
        columns: []
    })

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

    return {
        state,
        setState,
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
