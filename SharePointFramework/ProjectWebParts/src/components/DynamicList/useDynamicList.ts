import { useState, useCallback } from 'react'
import type { IWeb } from '@pnp/sp/webs'
import { IDynamicListProps, IDynamicListState } from './types'
import { useDynamicListDataFetch } from './data/useDynamicListDataFetch'

/**
 * Main hook for managing DynamicList state and data fetching.
 *
 * Initializes component state, provides a setState function that supports callbacks,
 * and triggers data fetching through useDynamicListDataFetch.
 *
 * @param props Component configuration properties
 * @param web The SharePoint web instance to use for operations
 * @returns Object containing state and setState function
 */
export function useDynamicList(props: IDynamicListProps, web: IWeb) {
  const [state, _setState] = useState<IDynamicListState>({
    isLoading: true,
    data: {
      listItems: [],
      listColumns: []
    },
    activeFilters: {},
    selectedItems: [],
    searchTerm: '',
    views: [],
    isChangingView: false,
    documentLibraryViewMode: props.documentLibraryViewMode
  })

  const setState = useCallback((newState: Partial<IDynamicListState>, callback?: () => void) => {
    _setState((prevState) => {
      const updatedState = { ...prevState, ...newState }
      if (callback) {
        setTimeout(callback, 0)
      }
      return updatedState
    })
  }, [])

  useDynamicListDataFetch(props, state, setState, web)

  return {
    state,
    setState
  }
}
