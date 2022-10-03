import SPDataAdapter from 'data'
import * as strings from 'ProjectWebPartsStrings'
import { IProjectPhasesData, IProjectPhasesProps } from '.'
import { getPhaseSitePages } from './getPhaseSitePages'
import { getWelcomePage } from './getWelcomePage'

/***
 * Fetch phase terms
 *
 * @param props ProjectPhases props
 */
export async function fetchData(props: IProjectPhasesProps): Promise<IProjectPhasesData> {
  const { phaseField } = props
  let phaseSitePages = []

  try {
    const [phaseFieldCtx, checklistData, welcomePage, properties] = await Promise.all([
      SPDataAdapter.getTermFieldContext(phaseField),
      SPDataAdapter.project.getChecklistData(strings.PhaseChecklistName),
      getWelcomePage(),
      SPDataAdapter.project.getPropertiesData()
    ])
    const [phases, currentPhaseName, userHasAdminPermission] = await Promise.all([
      SPDataAdapter.project.getPhases(phaseFieldCtx.termSetId, checklistData),
      SPDataAdapter.project.getCurrentPhaseName(phaseFieldCtx.fieldName),
      SPDataAdapter.checkProjectAdminPermission(properties.fieldValues)
    ])

    if (props.useDynamicHomepage) {
      phaseSitePages = await getPhaseSitePages(phases)
    }

    const [currentPhase] = phases.filter((p) => p.name === currentPhaseName)

    return {
      currentPhase,
      phases,
      phaseTextField: phaseFieldCtx.phaseTextField,
      phaseSitePages,
      welcomePage,
      userHasAdminPermission
    } as IProjectPhasesData
  } catch (error) {
    throw new Error()
  }
}
