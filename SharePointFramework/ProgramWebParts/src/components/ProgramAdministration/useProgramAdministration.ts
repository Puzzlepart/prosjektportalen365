import { ProjectAdminPermission } from 'pp365-shared-library/lib'
import { useEffect, useMemo, useReducer, useState } from 'react'
import reducer, { DATA_LOADED, SET_SELECTED_TO_DELETE, initialState } from './reducer'
import { IProgramAdministrationProps } from './types'
import { useId } from '@fluentui/react-components'

export const useProgramAdministration = (props: IProgramAdministrationProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const [programHubs, setProgramHubs] = useState<{ url: string; hubSiteId?: string }[] | undefined>(
    undefined
  )

  useEffect(() => {
    props.dataAdapter.project.getProjectInformationData().then((properties) => {
      Promise.all([
        props.dataAdapter.fetchChildProjects(),
        props.dataAdapter.checkProjectAdminPermissions(
          ProjectAdminPermission.ChildProjectsAdmin,
          properties.fieldValues
        ),
        props.dataAdapter.globalSettings.get('AvailableProgramHubs')
      ]).then(([childProjects, userHasManagePermission, availableProgramHubsRaw]) => {
        let parsedHubs: string[] = []
        if (availableProgramHubsRaw && typeof availableProgramHubsRaw === 'string') {
          parsedHubs = availableProgramHubsRaw
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        }

        if (parsedHubs.length > 0) {
          Promise.all(
            parsedHubs.map(async (u) => ({ url: u, hubSiteId: await props.dataAdapter.resolveHubSiteIdFromUrl(u) }))
          )
            .then((resolved) => setProgramHubs(resolved))
            .catch(() => setProgramHubs(undefined))
        } else {
          setProgramHubs(undefined)
        }

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

  return { context, childProjects, onSelectionChange, fluentProviderId, programHubs }
}
