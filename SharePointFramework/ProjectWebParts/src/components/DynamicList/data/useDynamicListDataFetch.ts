import { useEffect } from 'react'
import { IDynamicListProps, IDynamicListState, DocumentLibraryViewMode } from '../types'
import { fetchListData } from './fetchListData'
import { generateFilters } from './generateFilters'

/**
 * Hook that manages data fetching for DynamicList.
 *
 * Fetches list data whenever the list name, web URL, or refetch timestamp changes.
 * Handles view selection by using currentView from state if available, otherwise falls
 * back to defaultViewId from props. Generates filters from fetched data and updates
 * state with results.
 *
 * @param props Component configuration properties
 * @param state Current component state
 * @param setState Function to update component state
 */
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

    const viewIdToUse = state.currentView?.id || props.defaultViewId
    const propsWithView = { ...props, defaultViewId: viewIdToUse }

    let cancelled = false

    setState({ isLoading: true })

    fetchListData(propsWithView)
      .then((fetchedData) => {
        if (cancelled) return

        const filters = generateFilters(fetchedData)

        const newCurrentView =
          state.currentView ||
          fetchedData.views?.find((v) => v.id === viewIdToUse) ||
          fetchedData.views?.find((v) => v.isDefault)

        const isDocLib = fetchedData.baseTemplate === 101

        setState({
          data: fetchedData,
          views: fetchedData.views || [],
          currentView: newCurrentView,
          filters: filters,
          isDocumentLibrary: isDocLib,
          documentLibraryViewMode: isDocLib ? DocumentLibraryViewMode.Folders : undefined,
          currentFolderPath: isDocLib ? '' : undefined,
          isLoading: false,
          isChangingView: false,
          isRefetching: false
        })
      })
      .catch((error) => {
        if (cancelled) return
        console.error('[DynamicList] Error fetching data:', error)
        setState({
          error: error.message,
          isLoading: false,
          isChangingView: false,
          isRefetching: false
        })
      })

    return () => {
      cancelled = true
    }
  }, [props.listName, props.pageContext?.web?.absoluteUrl, state.refetch])
}
