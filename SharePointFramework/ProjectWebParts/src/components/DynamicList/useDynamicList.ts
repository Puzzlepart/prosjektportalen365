import { useState, useCallback } from 'react'
import { IDynamicListProps, IDynamicListState } from './types'
import { useDynamicListDataFetch } from './data/useDynamicListDataFetch'

/**
 * Main hook for managing DynamicList state and data fetching.
 *
 * Initializes component state, provides a setState function that supports callbacks,
 * and triggers data fetching through useDynamicListDataFetch.
 *
 * @param props Component configuration properties
 * @returns Object containing state and setState function
 */
export function useDynamicList(props: IDynamicListProps) {
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
    isChangingView: false
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

  useDynamicListDataFetch(props, state, setState)

  return {
    state,
    setState
  }
}
