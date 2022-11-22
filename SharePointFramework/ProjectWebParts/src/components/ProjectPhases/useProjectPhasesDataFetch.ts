import { SPFI } from '@pnp/sp'
import { AnyAction } from '@reduxjs/toolkit'
import { ProjectAdminPermission } from 'pp365-shared/lib/data/SPDataAdapterBase/ProjectAdminPermission'
import { ListLogger } from 'pp365-shared/lib/logging'
import * as strings from 'ProjectWebPartsStrings'
import { useEffect } from 'react'
import { IProjectPhasesData, IProjectPhasesProps, ProjectPhases } from '.'
import SPDataAdapter from '../../data'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { getPhaseSitePages } from './getPhaseSitePages'
import { INIT_DATA } from './reducer'

/**
 * Get welcome page of the web
 */
async function getWelcomePage(sp: SPFI) {
  try {
    const { WelcomePage } = await sp.web.rootFolder.select('welcomepage')()
    return WelcomePage
  } catch (error) {
    throw error
  }
}

/**
 * Fetch data for `ProjectPhases`.
 */
const fetchData: DataFetchFunction<IProjectPhasesProps, IProjectPhasesData> = async (props) => {
  try {
    SPDataAdapter.configure(props.spfxContext, { hubSiteContext: props.hubSiteContext })
    const [phaseFieldCtx, checklistData, welcomePage, properties] = await Promise.all([
      SPDataAdapter.getTermFieldContext(props.phaseField),
      SPDataAdapter.projectService.getChecklistData(strings.PhaseChecklistName),
      getWelcomePage(props.sp),
      SPDataAdapter.projectService.getPropertiesData()
    ])
    const [phases, currentPhaseName, userHasChangePhasePermission] = await Promise.all([
      SPDataAdapter.projectService.getPhases(phaseFieldCtx.termSetId, checklistData),
      SPDataAdapter.projectService.getCurrentPhaseName(phaseFieldCtx.fieldName),
      SPDataAdapter.checkProjectAdminPermissions(
        ProjectAdminPermission.ChangePhase,
        properties.fieldValues
      )
    ])

    const phaseSitePages = props.useDynamicHomepage ? await getPhaseSitePages({sp: props.sp, phases}) : []
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