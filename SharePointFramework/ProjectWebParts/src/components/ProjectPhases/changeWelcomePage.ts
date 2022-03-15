import initSpfxJsom, { ExecuteJsomQuery } from 'spfx-jsom'
import { IPhaseSitePageModel } from './types'

/**
 * Change phase
 *
 * @param {string} phaseName
 * @param {string} absoluteUrl absoluteurl
 * @param {IPhaseSitePageModel} phaseSitePages Phase SitePages
 */
export const changeWelcomePage = async (
  phaseName: string,
  absoluteUrl: string,
  phaseSitePages?: IPhaseSitePageModel,
) => {
  try {
    const spfxJsomContext = await initSpfxJsom(absoluteUrl)
    spfxJsomContext.jsomContext.web['get_rootFolder']()['set_welcomePage'](`SitePages/${phaseName}.aspx`)
    spfxJsomContext.jsomContext.web.update()
    await ExecuteJsomQuery(spfxJsomContext.jsomContext)
  } catch (error) {
    throw error
  }
}
