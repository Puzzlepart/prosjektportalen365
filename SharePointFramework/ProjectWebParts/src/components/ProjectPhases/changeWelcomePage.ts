import initSpfxJsom, { ExecuteJsomQuery } from 'spfx-jsom'
import _ from 'underscore'
import { IPhaseSitePageModel } from './types'

/**
 * Change welcome page.
 *
 * @param phaseName Phase page name
 * @param absoluteUrl Absolute URL
 * @param phaseSitePages Phase site pages
 */
export const changeWelcomePage = async (
  phaseName: string,
  absoluteUrl: string,
  phaseSitePages: IPhaseSitePageModel[] = []
) => {
  try {
    const phaseSitePage = _.find(phaseSitePages, (p) => p.title === phaseName)
    if (phaseSitePage?.fileLeafRef) {
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
