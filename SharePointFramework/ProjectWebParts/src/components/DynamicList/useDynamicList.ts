import { useState, useCallback } from 'react'
import { IDynamicListProps, IDynamicListState } from './types'
import { useDynamicListDataFetch } from './data/useDynamicListDataFetch'

export function useDynamicList(props: IDynamicListProps) {
  const [state, _setState] = useState<IDynamicListState>({
    isLoading: true,
    data: {
      listItems: [],
      listColumns: []
    },
    activeFilters: {},
    selectedItems: [],
    searchTerm: ''
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

  // Fetch data
  const data = useDynamicListDataFetch(props, state, setState)

  return {
    state: {
      ...state,
      data: data.listItems.length > 0 ? data : state.data
    },
    setState
  }
}
