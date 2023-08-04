import strings from 'ProjectWebPartsStrings'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { useContext } from 'react'
import { ProjectPhases } from '.'
import SPDataAdapter from '../../data'
import { changeWelcomePage } from './changeWelcomePage'
import { IProjectPhasesContext, ProjectPhasesContext } from './context'
import { modifyCurrentPhaseView } from './modifyCurrentPhaseView'
import { CHANGE_PHASE_ERROR, INIT_CHANGE_PHASE, SET_PHASE } from './reducer'
import { runPhaseHook } from './runPhaseHook'

/**
 * Change phase for the current project. Runs `SPDataAdapter.project.updatePhase`, runs phase
 * hooks if specified, and changes the welcome page if `useDynamicHomepage` is enabled. Also modified
 * current phase view for documents library.
 *
 * @param context Context for `ProjectPhases`
 */
const changePhase = async ({ state, props }: IProjectPhasesContext) => {
  try {
    await SPDataAdapter.project.updatePhase(state.confirmPhase, state.data.phaseTextField)
    if (props.usePhaseHooks) runPhaseHook(props.hookUrl, props.hookAuth, props.sp)
    if (props.useDynamicHomepage)
      await changeWelcomePage(
        state.phase.name,
        props.webPartContext.pageContext.web.absoluteUrl,
        state.data.phaseSitePages
      )
    await modifyCurrentPhaseView(state.confirmPhase.name, props)
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

/**
 * Hook for changing the current phase for the current project. Returns
 * a function that can be called to change the phase.
 *
 * @param delayBeforeReload Delay in milliseconds before reloading the page after changing the phase.
 */
export function useChangePhase(delayBeforeReload: number = 1000) {
  const context = useContext(ProjectPhasesContext)
  return async () => {
    context.dispatch(INIT_CHANGE_PHASE())
    try {
      await changePhase(context)
      context.dispatch(SET_PHASE({ phase: context.state.confirmPhase }))
      if (context.props.syncPropertiesAfterPhaseChange) {
        const currentUrlIsPageRelative =
          document.location.pathname.indexOf(context.state.data.welcomePage) > -1
        const welcomePage = !currentUrlIsPageRelative
          ? `${document.location.pathname}/${context.state.data.welcomePage}`
          : document.location.pathname
        setTimeout(() => {
          window.location.assign(
            `${document.location.protocol}//${document.location.hostname}${welcomePage}#syncproperties=1`
          )
          if (currentUrlIsPageRelative) window.location.reload()
        }, delayBeforeReload)
      }
    } catch (error) {
      context.dispatch(CHANGE_PHASE_ERROR({ error }))
    }
  }
}
