import { LogLevel } from '@pnp/logging'
import { SPFI } from '@pnp/sp'
import { AnyAction } from '@reduxjs/toolkit'
import * as strings from 'ProjectWebPartsStrings'
import { ListLogger, ProjectAdminPermission, ProjectPhaseModel } from 'pp365-shared-library/lib/'
import { useEffect } from 'react'
import SPDataAdapter from '../../data'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { ProjectPhases } from './index'
import { INIT_DATA } from './reducer'
import { IPhaseSitePageModel, IProjectPhasesData, IProjectPhasesProps } from './types'

/**
 * Get phase site pages.
 */
export const getPhaseSitePages: DataFetchFunction<
  { phases: ProjectPhaseModel[]; sp: SPFI },
  IPhaseSitePageModel[]
> = async (params) => {
  try {
    const pages = (
      await params.sp.web.lists
        .getByTitle('Områdesider')
        .items.select('Id', 'Title', 'FileLeafRef')()
    )
      .filter((p) => params.phases.some((phase) => phase.name === p.Title))
      .map<IPhaseSitePageModel>((p) => ({
        id: p.Id,
        title: p.Title,
        fileLeafRef: p.FileLeafRef
      }))
    return pages
  } catch (error) {
    throw error
  }
}

/**
 * Fetch data for `ProjectPhases`.
 */
const fetchData: DataFetchFunction<IProjectPhasesProps, IProjectPhasesData> = async (props) => {
  try {
    if (!SPDataAdapter.isConfigured) {
      SPDataAdapter.configure(props.webPartContext, {
        siteId: props.pageContext.site.id.toString(),
        webUrl: props.pageContext.web.absoluteUrl,
        logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
      })
    }
    const [phaseFieldCtx, checklistData, welcomePage, properties] = await Promise.all([
      SPDataAdapter.getTermFieldContext(props.phaseField),
      SPDataAdapter.project.getChecklistData(strings.PhaseChecklistName),
      SPDataAdapter.project.getWelcomePage(),
      SPDataAdapter.project.getProjectInformationData()
    ])
    const [phases, currentPhaseName, userHasChangePhasePermission] = await Promise.all([
      SPDataAdapter.project.getPhases(phaseFieldCtx.termSetId, checklistData),
      SPDataAdapter.project.getCurrentPhaseName(phaseFieldCtx.fieldName),
      SPDataAdapter.checkProjectAdminPermissions(
        ProjectAdminPermission.ChangePhase,
        properties.fieldValues
      )
    ])

    const phaseSitePages = props.useDynamicHomepage
      ? await getPhaseSitePages({ phases, sp: props.sp })
      : []
    const [currentPhase] = phases.filter((p) => p.name === currentPhaseName)
    return {
      currentPhase,
      phases,
      phaseTextField: phaseFieldCtx.textField,
      phaseSitePages,
      welcomePage,
      userHasChangePhasePermission
    } as IProjectPhasesData
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
