import { useEffect } from 'react'
import { IDynamicListProps, IDynamicListState } from '../types'
import { fetchListData } from './fetchListData'
import { generateFilters } from './generateFilters'

export function useDynamicListDataFetch(
  props: IDynamicListProps,
  state: IDynamicListState,
  setState: (newState: Partial<IDynamicListState>) => void
): void {
  useEffect(() => {
    if (!props.listName) {
      setState({
        data: { listItems: [], listColumns: [] },
        isLoading: false
      })
      return
    }

    // Use currentView if available, otherwise use props
    const viewIdToUse = state.currentView?.id || props.defaultViewId
    const propsWithView = { ...props, defaultViewId: viewIdToUse }

    console.log('[useDynamicListDataFetch] Fetching with view ID:', viewIdToUse, 'currentView:', state.currentView?.title)

    let cancelled = false

    setState({ isLoading: true })

    fetchListData(propsWithView)
      .then((fetchedData) => {
        if (cancelled) return

        console.log('[DynamicList] Fetched data:', {
          itemCount: fetchedData.listItems?.length,
          columnCount: fetchedData.listColumns?.length,
          columns: fetchedData.listColumns?.map(c => c.name)
        })

        // Generate filters from the fetched data
        const filters = generateFilters(fetchedData)
        console.log('[DynamicList] Generated filters:', filters.length)

        // Only set currentView if it's not already set or if it's the initial load
        const newCurrentView = state.currentView ||
          fetchedData.views?.find((v) => v.id === viewIdToUse) ||
          fetchedData.views?.find((v) => v.isDefault)

        setState({
          data: fetchedData,
          views: fetchedData.views || [],
          currentView: newCurrentView,
          filters: filters,
          isLoading: false,
          isChangingView: false,
          isRefetching: false
        })
      })
      .catch((error) => {
        if (cancelled) return
        console.error('[DynamicList] Error fetching data:', error)
        setState({ error: error.message, isLoading: false, isChangingView: false, isRefetching: false })
      })

    return () => {
      cancelled = true
    }
  }, [props.listName, props.pageContext?.web?.absoluteUrl, state.refetch])
}
