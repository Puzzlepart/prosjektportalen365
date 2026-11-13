import { ProjectAdminPermission } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { useEffect, useMemo, useReducer, useState } from 'react'
import reducer, { DATA_LOADED, SET_SELECTED_TO_DELETE, initialState } from './reducer'
import { IProgramAdministrationProps } from './types'
import { useId } from '@fluentui/react-components'
import { IProgramHub } from 'data'

/**
 * Resolves configured program hubs, loads child projects and manages administration state.
 * Falls back to the program's own hub when `AvailableProgramHubs` is empty.
 *
 * A hub that cannot be resolved and child projects that cannot be read leave the list empty: each
 * is counted for usage statistics, once and by the error's own code, for the web part.
 */
export const useProgramAdministration = (props: IProgramAdministrationProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const telemetry = useTelemetry()

  const [programHubs, setProgramHubs] = useState<IProgramHub[] | undefined>(undefined)

  useEffect(() => {
    void props.dataAdapter.project.getProjectInformationData().then(async (properties) => {
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
      // The program's own hub when the setting is empty or disabled: without it the list and the
      // add dialog were empty, with no word of why.
      if (parsedHubs.length === 0 && props.dataAdapter.portalDataService.url) {
        parsedHubs = [props.dataAdapter.portalDataService.url]
      }

      let resolvedHubs: IProgramHub[] = []
      if (parsedHubs.length > 0) {
        try {
          resolvedHubs = await Promise.all(
            parsedHubs.map(async (u) => {
              const resolved = await props.dataAdapter.portalDataService.resolveHubSiteFromUrl(u)
              return { url: u, hubSiteId: resolved.hubSiteId, title: resolved.title }
            })
          )
          props.dataAdapter.initializeHubWebs(resolvedHubs)
          setProgramHubs(resolvedHubs)
        } catch (error) {
          telemetry.trackError(error)
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
          telemetry.trackError(error)
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

  const onSelectionChange = (selectedItems: (string | number)[]) => {
    dispatch(SET_SELECTED_TO_DELETE(selectedItems as string[]))
  }

  const childProjects = [...state.childProjects]
  const fluentProviderId = useId('fp-program-administration')

  return { context, childProjects, onSelectionChange, fluentProviderId, programHubs }
}
