import SPDataAdapter from 'data'
import { ProjectPhaseModel } from 'pp365-shared/lib/models'
import { modifyCurrentPhaseView } from './modifyCurrentPhaseView'

/**
 * Change phase
 *
 * @param {ProjectPhaseModel} phase Phase
 * @param {string} phaseTextField Phase text field
 * @param {string} currentPhaseViewName Current phase view name
 */
export const changePhase = async (
  phase: ProjectPhaseModel,
  phaseTextField: string,
  currentPhaseViewName: string
) => {
  try {
    await SPDataAdapter.project.updatePhase(phase, phaseTextField)
    await modifyCurrentPhaseView(phase.name, currentPhaseViewName)
    sessionStorage.clear()
  } catch (error) {
    throw error
  }
}
