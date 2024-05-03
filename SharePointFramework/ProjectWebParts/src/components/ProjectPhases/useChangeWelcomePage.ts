import { useContext } from 'react'
import initSpfxJsom, { ExecuteJsomQuery } from 'spfx-jsom'
import _ from 'underscore'
import { ProjectPhasesContext } from './context'

/**
 * Hook for changing the welcome page for the current project.
 *
 * @returns A function that can be called to change the welcome page.
 */
export function useChangeWelcomePage() {
  const { props, state } = useContext(ProjectPhasesContext)
  return async () => {
    try {
      const phaseSitePage = _.find(
        state.data.phaseSitePages,
        (p) => p.title === state.confirmPhase.name
      )
      if (phaseSitePage?.fileLeafRef) {
        const spfxJsomContext = await initSpfxJsom(props.webAbsoluteUrl)
        spfxJsomContext.jsomContext.web['get_rootFolder']()['set_welcomePage'](
          `SitePages/${phaseSitePage.fileLeafRef}`
        )
        spfxJsomContext.jsomContext.web.update()
        await ExecuteJsomQuery(spfxJsomContext.jsomContext)
      }
    } catch (error) {
      throw error
    }
  }
}
