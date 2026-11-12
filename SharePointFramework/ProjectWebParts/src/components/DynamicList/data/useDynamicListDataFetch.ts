import { useEffect } from 'react'
import type { IWeb } from '@pnp/sp/webs'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { IDynamicListProps, IDynamicListState, DocumentLibraryViewMode } from '../types'
import { fetchListData } from './fetchListData'
import { generateFilters } from './generateFilters'

/**
 * Reloads list data and filters when its source or view changes, ignoring superseded requests.
 * A fetch that fails, and is shown, is counted for usage statistics, by its error code.
 */
export function useDynamicListDataFetch(
  props: IDynamicListProps,
  state: IDynamicListState,
  setState: (newState: Partial<IDynamicListState>) => void,
  web: IWeb
): void {
  const telemetry = useTelemetry()
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

    fetchListData(propsWithView, web)
      .then((fetchedData) => {
        if (cancelled) return

        const filters = generateFilters(fetchedData, props.nonFilterableColumns)

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
        telemetry.trackError(error)
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
  }, [props.listName, props.webAbsoluteUrl, state.refetch, web])

  useEffect(() => {
    if (state.data && state.data.listItems && state.data.listColumns) {
      const filters = generateFilters(state.data, props.nonFilterableColumns)
      setState({ filters })
    }
  }, [props.nonFilterableColumns])
}
