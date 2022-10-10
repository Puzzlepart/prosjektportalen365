import { sp } from '@pnp/sp'
import { useReducer, useEffect } from 'react'
import { fetchChildProjects } from './data'
import reducer, { initState, DATA_LOADED } from './reducer'
import { IProgramAdministrationProps } from './types'

export const useProgramAdministration = (props: IProgramAdministrationProps) => {
  const [state, dispatch] = useReducer(reducer, initState())

  sp.setup({
    sp: { baseUrl: props.context.pageContext.web.absoluteUrl }
  })

  useEffect(() => {
    fetchChildProjects(props.dataAdapter).then((childProjects) =>
      dispatch(DATA_LOADED({ data: { childProjects }, scope: 'root' }))
    )
  }, [])

  return { state, dispatch }
}
