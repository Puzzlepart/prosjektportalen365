import { sp } from '@pnp/sp'
import { ProjectPhaseModel } from 'pp365-shared/lib/models'
import { IPhaseSitePageModel } from './types'

/**
 * Get phase site pages.
 *
 * @param phases Phases
 */
export const getPhaseSitePages = async (phases: ProjectPhaseModel[]) => {
  try {
    let sitePages = await sp.web.lists
      .getByTitle('Områdesider')
      .items.select('Id, Title, FileRef, EncodedAbsUrl, FileLeafRef')
      .get()

    sitePages = sitePages.filter((p) => {
      return phases.some((phase) => phase.name === p.Title)
    })

    const phaseSitePages = sitePages.map<IPhaseSitePageModel>((p) => ({
      id: p.Id,
      title: p.Title,
      fileLeafRef: p.FileLeafRef
    }))

    return phaseSitePages
  } catch (error) {
    throw error
  }
}
