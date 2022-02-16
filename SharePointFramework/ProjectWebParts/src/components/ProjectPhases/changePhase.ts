import SPDataAdapter from 'data'
import { ProjectPhaseModel } from 'pp365-shared/lib/models'
import { changeWelcomePage } from './changeWelcomePage'
import { modifyCurrentPhaseView } from './modifyCurrentPhaseView'
import { IProjectPhasesProps } from './types'

/**
 * Change phase
 *
 * @param {ProjectPhaseModel} phase Phase
 * @param {string} currentPhaseViewName Current phase view name
 * @param {IProjectPhasesProps} props IProjectPhasesProps props
 */
export const changePhase = async (
  phase: ProjectPhaseModel,
  phaseTextField: string,
  props: IProjectPhasesProps,
) => {
  try {
    await SPDataAdapter.project.updatePhase(phase, phaseTextField)
    if (props.useDynamicHomepage) await changeWelcomePage(phase.name, props.webPartContext.pageContext.web.absoluteUrl);
    await modifyCurrentPhaseView(phase.name, props.currentPhaseViewName)
    sessionStorage.clear()
  } catch (error) {
    throw error
  }
}
