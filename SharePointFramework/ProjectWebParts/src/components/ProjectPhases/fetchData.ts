import { Logger, LogLevel } from '@pnp/logging'
import SPDataAdapter from 'data'
import * as strings from 'ProjectWebPartsStrings'
import { IProjectPhasesData } from '.'

/***
 * Fetch phase terms
 *
 * @param {string} phaseField Phase field
 */
export async function fetchData(phaseField: string): Promise<IProjectPhasesData> {
  try {
    const [phaseFieldCtx, checklistData] = await Promise.all([
      SPDataAdapter.getTermFieldContext(phaseField),
      SPDataAdapter.project.getChecklistData(strings.PhaseChecklistName)
    ])
    SPDataAdapter.clearCache()
    const [phases, currentPhaseName] = await Promise.all([
      SPDataAdapter.project.getPhases(phaseFieldCtx.termSetId, checklistData),
      SPDataAdapter.project.getCurrentPhaseName(phaseFieldCtx.fieldName)
    ])
    Logger.log({
      message: '(ProjectPhases) _fetchData: Successfully fetch phases',
      level: LogLevel.Info
    })
    const [currentPhase] = phases.filter((p) => p.name === currentPhaseName)
    return {
      currentPhase,
      phases,
      phaseTextField: phaseFieldCtx.phaseTextField
    }
  } catch (error) {
    throw new Error()
  }
}
