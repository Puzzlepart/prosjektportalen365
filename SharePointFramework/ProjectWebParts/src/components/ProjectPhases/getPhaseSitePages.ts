import { ProjectPhaseModel } from 'pp365-shared-library/lib/models'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { IPhaseSitePageModel } from './types'
import { SPFI } from '@pnp/sp'

/**
 * Get phase site pages.
 */
export const getPhaseSitePages: DataFetchFunction<
  { phases: ProjectPhaseModel[]; sp: SPFI },
  IPhaseSitePageModel[]
> = async (params) => {
  try {
    let sitePages = await params.sp.web.lists
      .getByTitle('Områdesider')
      .items.select('Id, Title, FileRef, EncodedAbsUrl, FileLeafRef')()

    sitePages = sitePages.filter((p) => params.phases.some((phase) => phase.name === p.Title))

    return sitePages.map<IPhaseSitePageModel>((p) => ({
      id: p.Id,
      title: p.Title,
      fileLeafRef: p.FileLeafRef
    }))
  } catch (error) {
    throw error
  }
}
