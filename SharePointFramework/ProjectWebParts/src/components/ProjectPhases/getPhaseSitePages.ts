import { ProjectPhaseModel } from 'pp365-shared/lib/models'
import { sp } from '@pnp/sp'
import { IPhaseSitePageModel } from './types'

/**
 * Change phase
 *
 * @param {ProjectPhaseModel} phases
 */
export const getPhaseSitePages = async (
  phases: ProjectPhaseModel[]
) => {
  try {
    let sitePages = await sp.web.lists.getByTitle('Områdesider').items.select('Id, Title, FileRef, EncodedAbsUrl, FileLeafRef').get()
    sitePages = sitePages.filter((p) => {
      return phases.some(phase => phase.name === p.Title)
    })

    const phaseSitePages: IPhaseSitePageModel[] = sitePages.map((p) => ({
      id: p.Id,
      title: p.Title,
      fileLeafRef: p.FileLeafRef
    }))

    return phaseSitePages
    
  } catch (error) {
    throw error
  }
}
