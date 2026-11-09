import { useContext } from 'react'
import SPDataAdapter from '../../data'
import { ProjectPhasesContext } from './context'
import {
  ARCHIVE_LOG_FAILED,
  CHANGE_PHASE_ERROR,
  HUB_SYNC_FAILED,
  INIT_CHANGE_PHASE,
  SET_PHASE
} from './reducer'
import { usePhaseHooks } from './usePhaseHooks'
import { ProjectPhases } from '.'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { useChangeWelcomePage } from './useChangeWelcomePage'
import { useModifyCurrentPhaseView } from './useModifyCurrentPhaseView'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import { getArchiveLogErrorReason, getHubSyncErrorReason } from '../../data/hubSyncError'

/**
 * Hook for changing the current phase for the current project. Returns
 * a function that can be called to change the phase, with the error from writing the archive log
 * when the change archived documents or lists and the log could not be written.
 *
 * @param delayBeforeReload Delay in milliseconds before reloading the page after changing the phase.
 */
export function useChangePhase(delayBeforeReload: number = 1000) {
  const context = useContext(ProjectPhasesContext)
  const [runHook] = usePhaseHooks()
  const changeWelcomePage = useChangeWelcomePage()
  const modifyCurrentPhaseView = useModifyCurrentPhaseView()
  return async (archiveLogError: Error | null = null) => {
    context.dispatch(INIT_CHANGE_PHASE())
    try {
      const hubError = await SPDataAdapter.updateProjectPhase(
        context.state.confirmPhase,
        context.state.data.phaseField
      )
      if (context.props.usePhaseHooks) void runHook()
      if (context.props.useDynamicHomepage) {
        await changeWelcomePage()
      }
      await modifyCurrentPhaseView()
      sessionStorage.clear()
      context.dispatch(SET_PHASE({ phase: context.state.confirmPhase }))
      if (archiveLogError) {
        context.dispatch(
          ARCHIVE_LOG_FAILED({
            warning: format(
              strings.ArchiveLogNotWrittenText,
              getArchiveLogErrorReason(archiveLogError)
            )
          })
        )
      }
      if (hubError) {
        // No reload: it would take the warning away before the user has read it.
        context.dispatch(
          HUB_SYNC_FAILED({
            warning: format(strings.PhaseNotSyncedToHubText, getHubSyncErrorReason(hubError))
          })
        )
        return
      }
      // No reload either when the archive log was not written: the warning would go with it.
      if (archiveLogError) return
      if (context.props.syncPropertiesAfterPhaseChange) {
        setTimeout(() => {
          if (context.props.useDynamicHomepage) window.location.href = context.props.webAbsoluteUrl
          else window.location.reload()
        }, delayBeforeReload)
      }
    } catch (error) {
      void ListLogger.log({
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
