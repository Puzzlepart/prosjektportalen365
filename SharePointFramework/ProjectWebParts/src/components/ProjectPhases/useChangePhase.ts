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
import {
  DISABLE_TELEMETRY_FLAG,
  flushTelemetry,
  useTelemetry
} from 'pp365-shared-library/lib/telemetry'
import { useChangeWelcomePage } from './useChangeWelcomePage'
import { useModifyCurrentPhaseView } from './useModifyCurrentPhaseView'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import { getArchiveLogErrorReason, getHubSyncErrorReason } from '../../data/hubSyncError'

/**
 * Empties the session cache, so that the page reads the project anew in its new phase. The
 * tester's switch for usage statistics is kept: emptied with the rest, a tab that had turned them
 * off would send again from the reload on. The other keys are removed one by one, so nothing is
 * written.
 */
function clearSessionCache(): void {
  for (let index = sessionStorage.length - 1; index >= 0; index--) {
    const key = sessionStorage.key(index)
    if (key !== DISABLE_TELEMETRY_FLAG) sessionStorage.removeItem(key)
  }
}

/**
 * Hook for changing the current phase for the current project. Returns
 * a function that can be called to change the phase, with the error from writing the archive log
 * when the change archived documents or lists and the log could not be written. Each failure the
 * user is told of (the change itself, the hub that did not take it, the archive log) is counted
 * for usage statistics, by its error code.
 *
 * @param delayBeforeReload Delay in milliseconds before reloading the page after changing the phase.
 */
export function useChangePhase(delayBeforeReload: number = 1000) {
  const context = useContext(ProjectPhasesContext)
  const telemetry = useTelemetry()
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
      clearSessionCache()
      context.dispatch(SET_PHASE({ phase: context.state.confirmPhase }))
      telemetry.track('phase.changed')
      if (archiveLogError) {
        telemetry.trackError(archiveLogError)
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
        telemetry.trackError(hubError)
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
          // What was counted is sent before the page goes: a reload may leave no time for it.
          flushTelemetry({ urgent: true })
          if (context.props.useDynamicHomepage) window.location.href = context.props.webAbsoluteUrl
          else window.location.reload()
        }, delayBeforeReload)
      }
    } catch (error) {
      telemetry.trackError(error)
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
