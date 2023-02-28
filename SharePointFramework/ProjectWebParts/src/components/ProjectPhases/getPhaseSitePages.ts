import { sp } from '@pnp/sp'
import { ProjectPhaseModel } from 'pp365-shared/lib/models'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { IPhaseSitePageModel } from './types'

/**
 * Get phase site pages.
 *
 * @param phases Phases
 */
export const getPhaseSitePages: DataFetchFunction<
  ProjectPhaseModel[],
  IPhaseSitePageModel[]
> = async (phases) => {
  try {
    let sitePages = await sp.web.lists
      .getByTitle('Områdesider')
      .items.select('Id, Title, FileRef, EncodedAbsUrl, FileLeafRef')
      .get()

    sitePages = sitePages.filter((p) => {
      return phases.some((phase) => phase.name === p.Title)
    })

    return sitePages.map<IPhaseSitePageModel>((p) => ({
      id: p.Id,
      title: p.Title,
      fileLeafRef: p.FileLeafRef
    }))
  } catch (error) {
    throw error
  }
}
