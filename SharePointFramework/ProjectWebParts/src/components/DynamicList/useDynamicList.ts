import { useState, useCallback, useEffect } from 'react'
import type { IWeb } from '@pnp/sp/webs'
import { IDynamicListProps, IDynamicListState } from './types'
import { useDynamicListDataFetch } from './data/useDynamicListDataFetch'
import { useListPermissions } from './hooks/useListPermissions'

/** Coordinates list data, permissions and partial state updates with optional completion callbacks. */
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

  const permissions = useListPermissions(props.listName, props.webUrl, props.webContextMode)

  useEffect(() => {
    if (!permissions.isLoading) {
      setState({
        permissions: {
          canAdd: permissions.canAdd,
          canEdit: permissions.canEdit,
          canDelete: permissions.canDelete
        }
      })
    }
  }, [
    permissions.canAdd,
    permissions.canEdit,
    permissions.canDelete,
    permissions.isLoading,
    setState
  ])

  useDynamicListDataFetch(props, state, setState, web)

  return {
    state,
    setState
  }
}
