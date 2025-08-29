import { ProjectAdminPermission } from 'pp365-shared-library/lib'
import { useEffect, useMemo, useReducer } from 'react'
import reducer, { DATA_LOADED, SET_SELECTED_TO_DELETE, initialState } from './reducer'
import { IProgramAdministrationProps } from './types'
import { useId } from '@fluentui/react-components'

export const useProgramAdministration = (props: IProgramAdministrationProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    props.dataAdapter.project.getProjectInformationData().then((properties) => {
      Promise.all([
        props.dataAdapter.fetchChildProjects(),
        props.dataAdapter.checkProjectAdminPermissions(
          ProjectAdminPermission.ChildProjectsAdmin,
          properties.fieldValues
        )
      ]).then(([childProjects, userHasManagePermission]) => {
        dispatch(
          DATA_LOADED({
            data: { childProjects, userHasManagePermission },
            scope: 'ProgramAdministration'
          })
        )
      })
    })
  }, [])

  const context = useMemo(() => ({ props, state, dispatch }), [props, state])

  /**
   * Callback function for handling selection change in the `ProjectList` component.
   */
  const onSelectionChange = (_: any, { selectedItems }) => {
    dispatch(SET_SELECTED_TO_DELETE(Array.from(selectedItems)))
  }

  const childProjects = [...state.childProjects]
  const fluentProviderId = useId('fp-program-administration')

  return { context, childProjects, onSelectionChange, fluentProviderId }
}
