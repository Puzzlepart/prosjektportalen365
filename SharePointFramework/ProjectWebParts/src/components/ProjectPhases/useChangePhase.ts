import { useContext } from 'react'
import SPDataAdapter from '../../data'
import { ProjectPhasesContext } from './context'
import { CHANGE_PHASE_ERROR, INIT_CHANGE_PHASE, SET_PHASE } from './reducer'
import { usePhaseHooks } from './usePhaseHooks'
import { ProjectPhases } from '.'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { useChangeWelcomePage } from './useChangeWelcomePage'
import { useModifyCurrentPhaseView } from './useModifyCurrentPhaseView'
import strings from 'ProjectWebPartsStrings'

/**
 * Hook for changing the current phase for the current project. Returns
 * a function that can be called to change the phase.
 *
 * @param delayBeforeReload Delay in milliseconds before reloading the page after changing the phase.
 */
export function useChangePhase(delayBeforeReload: number = 1000) {
  const context = useContext(ProjectPhasesContext)
  const [runPhaseHook] = usePhaseHooks()
  const changeWelcomePage = useChangeWelcomePage()
  const modifyCurrentPhaseView = useModifyCurrentPhaseView()
  return async () => {
    context.dispatch(INIT_CHANGE_PHASE())
    try {
      await SPDataAdapter.project.updateProjectPhase(
        context.state.confirmPhase,
        context.state.data.phaseTextField
      )
      if (context.props.usePhaseHooks) runPhaseHook()
      if (context.props.useDynamicHomepage) {
        await changeWelcomePage()
      }
      await modifyCurrentPhaseView()
      sessionStorage.clear()
      context.dispatch(SET_PHASE({ phase: context.state.confirmPhase }))
      if (context.props.syncPropertiesAfterPhaseChange) {
        // TODO: Sync phase to hub site item
        setTimeout(() => {
          if (context.props.useDynamicHomepage)
            window.location.href = context.props.webAbsoluteUrl
          else
            window.location.reload()
        }, delayBeforeReload)
      }
    } catch (error) {
      ListLogger.log({
        message: error.message,
        level: 'Error',
        functionName: 'changePhase',
        component: ProjectPhases.displayName
      })
      context.dispatch(
        CHANGE_PHASE_ERROR({ error: new Error(strings.ProjectPhasesChangePhaseError) })
      )
    }
  }
}
