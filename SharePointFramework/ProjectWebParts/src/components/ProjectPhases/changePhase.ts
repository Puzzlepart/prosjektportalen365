import SPDataAdapter from '../../data'
import { ProjectPhaseModel } from 'pp365-shared-library/lib/models'
import { changeWelcomePage } from './changeWelcomePage'
import { runPhaseHook } from './runPhaseHook'
import { modifyCurrentPhaseView } from './modifyCurrentPhaseView'
import { IPhaseSitePageModel, IProjectPhasesProps } from './types'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { ProjectPhases } from '.'
import strings from 'ProjectWebPartsStrings'

/**
 * Change phase for the current project. Runs `SPDataAdapter.project.updatePhase`, runs phase
 * hooks if specified, and changes the welcome page if `useDynamicHomepage` is enabled. Also modified
 * current phase view for documents library.
 *
 * @param phase Phase
 * @param phaseTextField Phase text field
 * @param props Component props for `ProjectPhases`
 * @param phaseSitePages Phase site pages
 */
export const changePhase = async (
  phase: ProjectPhaseModel,
  phaseTextField: string,
  props: IProjectPhasesProps,
  phaseSitePages?: IPhaseSitePageModel[]
) => {
  try {
    await SPDataAdapter.project.updatePhase(phase, phaseTextField)
    if (props.usePhaseHooks) runPhaseHook(props.hookUrl, props.hookAuth, props.sp)
    if (props.useDynamicHomepage)
      await changeWelcomePage(
        phase.name,
        props.webPartContext.pageContext.web.absoluteUrl,
        phaseSitePages
      )
    await modifyCurrentPhaseView(phase.name, props)
    sessionStorage.clear()
  } catch (error) {
    ListLogger.log({
      message: error.message,
      level: 'Error',
      functionName: 'changePhase',
      component: ProjectPhases.displayName
    })
    throw new Error(strings.ProjectPhasesChangePhaseError)
  }
}
