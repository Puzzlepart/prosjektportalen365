import { LogLevel } from '@pnp/logging'
import { sp } from '@pnp/sp'
import { ProjectAdminPermission } from 'pp365-shared/lib/data/SPDataAdapterBase/ProjectAdminPermission'
import * as strings from 'ProjectWebPartsStrings'
import { IProjectPhasesData, IProjectPhasesProps } from '.'
import SPDataAdapter from '../../data'
import { getPhaseSitePages } from './getPhaseSitePages'

/**
 * Get welcome page of the web
 */
async function getWelcomePage() {
  try {
    const { WelcomePage } = await sp.web.rootFolder.select('welcomepage').get()
    return WelcomePage
  } catch (error) {
    throw error
  }
}

/**
 * Fetch data for `ProjectPhases`.
 *
 * @param props ProjectPhases props
 */
export async function fetchData(props: IProjectPhasesProps): Promise<IProjectPhasesData> {
  try {
    SPDataAdapter.configure(props.webPartContext, {
      siteId: props.siteId,
      webUrl: props.webUrl,
      hubSiteUrl: props.hubSite.url,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    })
    const [phaseFieldCtx, checklistData, welcomePage, properties] = await Promise.all([
      SPDataAdapter.getTermFieldContext(props.phaseField),
      SPDataAdapter.project.getChecklistData(strings.PhaseChecklistName),
      getWelcomePage(),
      SPDataAdapter.project.getPropertiesData()
    ])
    const [phases, currentPhaseName, userHasChangePhasePermission] = await Promise.all([
      SPDataAdapter.project.getPhases(phaseFieldCtx.termSetId, checklistData),
      SPDataAdapter.project.getCurrentPhaseName(phaseFieldCtx.fieldName),
      SPDataAdapter.checkProjectAdminPermissions(
        ProjectAdminPermission.ChangePhase,
        properties.fieldValues
      )
    ])

    const phaseSitePages = props.useDynamicHomepage ? await getPhaseSitePages(phases) : []
    const [currentPhase] = phases.filter((p) => p.name === currentPhaseName)

    return {
      currentPhase,
      phases,
      phaseTextField: phaseFieldCtx.phaseTextField,
      phaseSitePages,
      welcomePage,
      userHasChangePhasePermission
    } as IProjectPhasesData
  } catch {
    throw new Error(strings.ProjectPhasesFetchDataError)
  }
}
