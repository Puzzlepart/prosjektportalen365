/* eslint-disable prefer-spread */
import { useReducer } from 'react'
import { IProjectStatusContext } from './context'
import reducer, { initialState } from './reducer'
import { IProjectStatusProps } from './types'
import { useProjectStatusDataFetch } from './useProjectStatusDataFetch'

/**
 * Component logic hook for `ProjectStatus`
 */
export function useProjectStatus(props: IProjectStatusProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useProjectStatusDataFetch(props, dispatch)

  const context: IProjectStatusContext = {
    props,
    state,
    dispatch
  }

  return { context }
}
