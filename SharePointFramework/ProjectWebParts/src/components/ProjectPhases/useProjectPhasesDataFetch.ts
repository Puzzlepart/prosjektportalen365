import { LogLevel } from '@pnp/logging'
import { ProjectAdminPermission } from 'pp365-shared-library/lib/data/SPDataAdapterBase/ProjectAdminPermission'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import * as strings from 'ProjectWebPartsStrings'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { IProjectPhasesData, IProjectPhasesProps, ProjectPhases } from '.'
import SPDataAdapter from '../../data'
import { getPhaseSitePages } from './getPhaseSitePages'
import { useEffect } from 'react'
import { AnyAction } from '@reduxjs/toolkit'
import { INIT_DATA } from './reducer'

/**
 * Fetch data for `ProjectPhases`.
 */
const fetchData: DataFetchFunction<
  IProjectPhasesProps,
  IProjectPhasesData
> = async (props) => {
  try {
    if (!SPDataAdapter.isConfigured) {
      SPDataAdapter.configure(props.webPartContext, {
        siteId: props.siteId,
        webUrl: props.webUrl,
        logLevel:
          sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
      })
    }
    const [phaseFieldCtx, checklistData, welcomePage, properties] =
      await Promise.all([
        SPDataAdapter.getTermFieldContext(props.phaseField),
        SPDataAdapter.project.getChecklistData(strings.PhaseChecklistName),
        SPDataAdapter.project.getWelcomePage(),
        SPDataAdapter.project.getPropertiesData()
      ])
    const [phases, currentPhaseName, userHasChangePhasePermission] =
      await Promise.all([
        SPDataAdapter.project.getPhases(phaseFieldCtx.termSetId, checklistData),
        SPDataAdapter.project.getCurrentPhaseName(phaseFieldCtx.fieldName),
        SPDataAdapter.checkProjectAdminPermissions(
          ProjectAdminPermission.ChangePhase,
          properties.fieldValues
        )
      ])

    const phaseSitePages = props.useDynamicHomepage
      ? await getPhaseSitePages(phases)
      : []
    const [currentPhase] = phases.filter((p) => p.name === currentPhaseName)
    return {
      currentPhase,
      phases,
      phaseTextField: phaseFieldCtx.phaseTextField,
      phaseSitePages,
      welcomePage,
      userHasChangePhasePermission
    }
  } catch (error) {
    ListLogger.log({
      message: error.message,
      level: 'Error',
      functionName: 'fetchData',
      component: ProjectPhases.displayName
    })
    throw new Error(strings.ProjectPhasesFetchDataError)
  }
}

/**
 * Fetch hook for `ProjectPhases`
 *
 * @param props Component properties for `ProjectPhases`
 * @param dispatch Dispatcer
 */
export const useProjectPhasesDataFetch = (
  props: IProjectPhasesProps,
  dispatch: React.Dispatch<AnyAction>
) => {
  useEffect(() => {
    fetchData(props)
      .then((data) => dispatch(INIT_DATA({ data })))
      .catch((error) => dispatch(INIT_DATA({ data: null, error })))
  }, [])
}
