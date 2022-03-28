import initSpfxJsom, { ExecuteJsomQuery } from 'spfx-jsom'
import _ from 'underscore'
import { IPhaseSitePageModel } from './types'

/**
 * Change phase
 *
 * @param {string} phaseName
 * @param {string} absoluteUrl absoluteurl
 * @param {IPhaseSitePageModel[]} phaseSitePages Phase SitePages
 */
export const changeWelcomePage = async (
  phaseName: string,
  absoluteUrl: string,
  phaseSitePages?: IPhaseSitePageModel[]
) => {
  try {
    const phaseSitePage = phaseSitePages && _.find(phaseSitePages, (p) => p.title === phaseName)
    if (phaseSitePage && phaseSitePage.fileLeafRef) {
      const spfxJsomContext = await initSpfxJsom(absoluteUrl)
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
