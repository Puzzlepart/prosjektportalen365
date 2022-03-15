import SPDataAdapter from 'data'
import { ProjectPhaseModel } from 'pp365-shared/lib/models'
import { changeWelcomePage } from './changeWelcomePage'
import { modifyCurrentPhaseView } from './modifyCurrentPhaseView'
import { IPhaseSitePageModel, IProjectPhasesProps } from './types'

/**
 * Change phase
 *
 * @param {ProjectPhaseModel} phase Phase
 * @param {string} phaseTextField Phase TextField
 * @param {IProjectPhasesProps} props IProjectPhasesProps props
 * @param {IPhaseSitePageModel[]} phaseSitePages Phase SitePages
 */
export const changePhase = async (
  phase: ProjectPhaseModel,
  phaseTextField: string,
  props: IProjectPhasesProps,
  phaseSitePages?: IPhaseSitePageModel[],
) => {
  try {
    await SPDataAdapter.project.updatePhase(phase, phaseTextField)
    if (props.useDynamicHomepage) await changeWelcomePage(phase.name, props.webPartContext.pageContext.web.absoluteUrl, phaseSitePages)
    await modifyCurrentPhaseView(phase.name, props.currentPhaseViewName)
    sessionStorage.clear()
  } catch (error) {
    throw error
  }
}
