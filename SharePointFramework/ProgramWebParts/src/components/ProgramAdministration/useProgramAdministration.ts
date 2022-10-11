import { sp } from '@pnp/sp'
import { ProjectAdminPermission } from 'pp365-shared/lib/data/SPDataAdapterBase/ProjectAdminPermission'
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
    props.dataAdapter.project.getPropertiesData().then((properties) => {
      Promise.all([
        fetchChildProjects(props.dataAdapter),
        props.dataAdapter.checkProjectAdminPermissions(
          ProjectAdminPermission.ChildProjectsAdmin,
          properties.fieldValues
        )
      ]).then(([childProjects, userHasManagePermission]) =>
        dispatch(DATA_LOADED({ data: { childProjects, userHasManagePermission }, scope: 'root' }))
      )
    })
  }, [])

  return { state, dispatch }
}
