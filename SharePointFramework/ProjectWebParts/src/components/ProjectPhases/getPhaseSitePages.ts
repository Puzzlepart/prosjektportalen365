import { ProjectPhaseModel } from 'pp365-shared/lib/models'
import { sp } from "@pnp/sp";
import { IPhaseSitePageModel } from './types';

/**
 * Change phase
 *
 * @param {ProjectPhaseModel} phases
 */
export const getPhaseSitePages = async (
  phases: ProjectPhaseModel[]
) => {
  try {
    let sitepages = await sp.web.lists.getByTitle('Områdesider').items.select("Id, Title, FileRef, EncodedAbsUrl, FileLeafRef").get()
    sitepages = sitepages.filter(sitepage => {
      return phases.some(phase => phase.name === sitepage.Title)
    })

    const phaseSitePages: IPhaseSitePageModel[] = sitepages.map((item) => ({
      id: item.Id,
      title: item.Title,
      fileLeafRef: item.FileLeafRef
    }))

    return phaseSitePages
    
  } catch (error) {
    throw error
  }
}
