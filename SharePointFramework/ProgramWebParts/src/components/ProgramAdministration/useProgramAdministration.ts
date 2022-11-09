import { sp } from '@pnp/sp'
import { ProjectAdminPermission } from 'pp365-shared/lib/data/SPDataAdapterBase/ProjectAdminPermission'
import { useReducer, useEffect } from 'react'
import { fetchChildProjects } from './data'
import reducer, { initialState, DATA_LOADED, SET_SELECTED_TO_DELETE } from './reducer'
import { IProgramAdministrationProps } from './types'
import { useRowRenderer } from './useRowRenderer'
import { useSelectionList } from './useSelectionList'

export const useProgramAdministration = (props: IProgramAdministrationProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const selectedKeys = state.selectedProjectsToDelete.map((p) => p.key)

  sp.setup({
    sp: { baseUrl: props.context.pageContext.web.absoluteUrl }
  })

  const { selection, onSearch, searchTerm } = useSelectionList(selectedKeys, (selected) => {
    dispatch(SET_SELECTED_TO_DELETE({ selected }))
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

  const onRenderRow = useRowRenderer({
    selectedKeys,
    searchTerm
  })

  return { state, dispatch, selection, onSearch, searchTerm, onRenderRow } as const
}
