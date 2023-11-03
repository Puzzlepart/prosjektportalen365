import { ProjectAdminPermission } from 'pp365-shared-library/lib'
import { useEffect, useReducer } from 'react'
import reducer, { DATA_LOADED, SET_SELECTED_TO_DELETE, initialState } from './reducer'
import { IProgramAdministrationProps } from './types'
import { useRowRenderer } from './useRowRenderer'
import { useSelectionList } from './useSelectionList'
import { useColumns } from './useColumns'

export const useProgramAdministration = (props: IProgramAdministrationProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  // const selectedKeys = state.selectedProjectsToDelete.map((p) => p.key)

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

  const columns = useColumns()

  return { state, dispatch, columns } as const
}
