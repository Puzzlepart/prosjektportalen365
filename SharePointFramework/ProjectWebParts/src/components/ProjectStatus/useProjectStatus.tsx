import { useReducer } from 'react'
import { IProjectStatusContext } from './context'
import reducer, { initialState } from './reducer'
import { IProjectStatusProps } from './types'
import { useProjectStatusDataFetch } from './useProjectStatusDataFetch'

/** Connects report reducer state and data loading to the shared status context. */
export function useProjectStatus(props: IProjectStatusProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useProjectStatusDataFetch(props, state.refetch, state.selectedScope, dispatch)

  const context: IProjectStatusContext = {
    props,
    state,
    dispatch
  }

  return { context }
}
