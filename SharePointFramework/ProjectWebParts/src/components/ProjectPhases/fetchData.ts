import { Logger, LogLevel } from '@pnp/logging'
import SPDataAdapter from 'data'
import * as strings from 'ProjectWebPartsStrings'
import { IProjectPhasesData, IProjectPhasesProps } from '.'
import { getPhaseSitePages } from './getPhaseSitePages'

/***
 * Fetch phase terms
 *
 * @param {IProjectPhasesProps} props IProjectPhasesProps props
 */
export async function fetchData(props: IProjectPhasesProps): Promise<IProjectPhasesData> {
  const { phaseField } = props
  let phaseSitePages;

  try {
    const [phaseFieldCtx, checklistData] = await Promise.all([
      SPDataAdapter.getTermFieldContext(phaseField),
      SPDataAdapter.project.getChecklistData(strings.PhaseChecklistName)
    ])
    const [phases, currentPhaseName] = await Promise.all([
      SPDataAdapter.project.getPhases(phaseFieldCtx.termSetId, checklistData),
      SPDataAdapter.project.getCurrentPhaseName(phaseFieldCtx.fieldName)
    ])

    if (props.useDynamicHomepage) {
      phaseSitePages = await getPhaseSitePages(phases);
      console.log("fetchData", phaseSitePages)
    }

    Logger.log({
      message: '(ProjectPhases) _fetchData: Successfully fetch phases',
      level: LogLevel.Info
    })
    const [currentPhase] = phases.filter((p) => p.name === currentPhaseName)

    console.log(props)

    console.log(phaseSitePages)


    return {
      currentPhase,
      phases,
      phaseTextField: phaseFieldCtx.phaseTextField,
      phaseSitePages
    }
  } catch (error) {
    throw new Error()
  }
}
