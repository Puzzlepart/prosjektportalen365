/* eslint-disable prefer-spread */
import { ProviderProps, useEffect, useReducer } from 'react'
import { IProjectStatusContext } from './context'
import { fetchData } from './fetchData'
import reducer, { initialState, INIT_DATA } from './reducer'
import { IProjectStatusProps } from './types'

/**
 * Component logic hook for `ProjectStatus`
 */
export function useProjectStatus(props: IProjectStatusProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    fetchData(props).then((data) => {
      dispatch(INIT_DATA({ data }))
    })
  }, [])

  const value = { props, state, dispatch }

  return { value } as ProviderProps<IProjectStatusContext>
}
