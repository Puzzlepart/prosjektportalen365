/* eslint-disable prefer-spread */
import { ProviderProps, useReducer } from 'react'
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

  const value: IProjectStatusContext = { props, state, dispatch }

  return { value } as ProviderProps<IProjectStatusContext>
}
