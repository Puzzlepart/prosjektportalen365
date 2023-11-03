import { ProjectAdminPermission } from 'pp365-shared-library/lib'
import { useEffect, useMemo, useReducer } from 'react'
import reducer, { DATA_LOADED, initialState } from './reducer'
import { IProgramAdministrationProps } from './types'

export const useProgramAdministration = (props: IProgramAdministrationProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    props.dataAdapter.project.getProjectInformationData().then((properties) => {
      Promise.all([
        props.dataAdapter.fetchChildProjects(properties.fieldValues.id),
        props.dataAdapter.checkProjectAdminPermissions(
          ProjectAdminPermission.ChildProjectsAdmin,
          properties.fieldValues
        )
      ]).then(([childProjects, userHasManagePermission]) => {
        dispatch(DATA_LOADED({ data: { childProjects, userHasManagePermission }, scope: 'root' }))
      })
    })
  }, [])

  const context = useMemo(() => ({ props, state, dispatch }), [props, state])

  return { context }
}
