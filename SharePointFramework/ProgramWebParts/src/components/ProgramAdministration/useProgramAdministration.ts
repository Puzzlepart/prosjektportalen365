import { ProjectAdminPermission } from 'pp365-shared-library/lib'
import { useEffect, useReducer } from 'react'
import reducer, { DATA_LOADED, SET_SELECTED_TO_DELETE, initialState } from './reducer'
import { IProgramAdministrationProps } from './types'
import { useRowRenderer } from './useRowRenderer'
import { useSelectionList } from './useSelectionList'

export const useProgramAdministration = (props: IProgramAdministrationProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const selectedKeys = state.selectedProjectsToDelete.map((p) => p.key)

  const { selection, onSearch, searchTerm } = useSelectionList(selectedKeys, (selected) => {
    dispatch(SET_SELECTED_TO_DELETE({ selected }))
  })

  useEffect(() => {
    props.dataAdapter.project.getProjectInformationData().then((properties) => {
      Promise.all([
        props.dataAdapter.fetchChildProjects(),
        props.dataAdapter.checkProjectAdminPermissions(
          ProjectAdminPermission.ChildProjectsAdmin,
          properties.fieldValues
        )
      ]).then(([childProjects, userHasManagePermission]) => {
        dispatch(DATA_LOADED({ data: { childProjects, userHasManagePermission }, scope: 'root' }))
      })
    })
  }, [])

  const onRenderRow = useRowRenderer({
    selectedKeys,
    searchTerm
  })

  return { state, dispatch, selection, onSearch, searchTerm, onRenderRow } as const
}
