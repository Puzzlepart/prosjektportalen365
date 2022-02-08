import { Logger, LogLevel } from '@pnp/logging'
import { sp } from "@pnp/sp";
import SPDataAdapter from 'data'
import * as strings from 'ProjectWebPartsStrings'
import { IProjectPhasesData, IProjectPhasesProps } from '.'

/***
 * Fetch phase terms
 *
 * @param {IProjectPhasesProps} props IProjectPhasesProps props
 */
export async function fetchData(props: IProjectPhasesProps): Promise<IProjectPhasesData> {
  const { phaseField, useDynamicHomepage } = props;
  try {
    const [phaseFieldCtx, checklistData] = await Promise.all([
      SPDataAdapter.getTermFieldContext(phaseField),
      SPDataAdapter.project.getChecklistData(strings.PhaseChecklistName)
    ])
    const [phases, currentPhaseName] = await Promise.all([
      SPDataAdapter.project.getPhases(phaseFieldCtx.termSetId, checklistData),
      SPDataAdapter.project.getCurrentPhaseName(phaseFieldCtx.fieldName)
    ])

    if (!useDynamicHomepage) {
      let sitepages = await sp.web.lists.getByTitle('Områdesider').items.get()
      console.log("1", sitepages)

      sitepages = sitepages.filter(sitepage => {
        return phases.some(phase => phase.name === sitepage.Title)
      })

      sitepages = sitepages.map((item) => ({
        id: item.Id,
        title: item.Title
      }))

      console.log(sitepages)
    }

    console.log(phases)

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
