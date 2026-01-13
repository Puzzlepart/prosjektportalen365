import { ProjectAdminPermission } from 'pp365-shared-library/lib'
import { useEffect, useMemo, useReducer, useState } from 'react'
import reducer, { DATA_LOADED, SET_SELECTED_TO_DELETE, initialState } from './reducer'
import { IProgramAdministrationProps } from './types'
import { useId } from '@fluentui/react-components'
import { IProgramHub } from 'data'

export const useProgramAdministration = (props: IProgramAdministrationProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const [programHubs, setProgramHubs] = useState<IProgramHub[] | undefined>(undefined)

  useEffect(() => {
    props.dataAdapter.project.getProjectInformationData().then(async (properties) => {
      const [userHasManagePermission, availableProgramHubsRaw] = await Promise.all([
        props.dataAdapter.checkProjectAdminPermissions(
          ProjectAdminPermission.ChildProjectsAdmin,
          properties.fieldValues
        ),
        props.dataAdapter.globalSettings.get('AvailableProgramHubs')
      ])

      let parsedHubs: string[] = []
      if (availableProgramHubsRaw && typeof availableProgramHubsRaw === 'string') {
        parsedHubs = availableProgramHubsRaw
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
      }

      let resolvedHubs: IProgramHub[] = []
      if (parsedHubs.length > 0) {
        try {
          resolvedHubs = await Promise.all(
            parsedHubs.map(async (u) => {
              const resolved = await props.dataAdapter.resolveHubSiteFromUrl(u)
              return { url: u, hubSiteId: resolved.hubSiteId, title: resolved.title }
            })
          )
          props.dataAdapter.initializeHubWebs(resolvedHubs)
          setProgramHubs(resolvedHubs)
        } catch {
          setProgramHubs(undefined)
        }
      } else {
        setProgramHubs(undefined)
      }

      let childProjects = []
      if (resolvedHubs.length > 0) {
        try {
          childProjects = await props.dataAdapter.fetchChildProjects(resolvedHubs)
        } catch (error) {
          console.error('Failed to fetch child projects:', error)
        }
      }

      dispatch(
        DATA_LOADED({
          data: { childProjects, userHasManagePermission },
          scope: 'ProgramAdministration'
        })
      )
    })
  }, [])

  const context = useMemo(
    () => ({ props, state, dispatch, programHubs }),
    [props, state, programHubs]
  )

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
