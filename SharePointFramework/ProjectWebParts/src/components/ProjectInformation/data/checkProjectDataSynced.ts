import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from '../../../data'
import { DataFetchFunction } from '../../../types/DataFetchFunction'
import { IProjectInformationContext } from '../context'

/**
 * Checks if project data is synced.
 *
 * @param context Context for `ProjectInformation`
 */
export const checkProjectDataSynced: DataFetchFunction<
  IProjectInformationContext,
  boolean
> = async (context) => {
  try {
    let isSynced = false
    const projectDataList = SPDataAdapter.portal.web.lists.getByTitle(strings.IdeaProjectDataTitle)
    const [projectDataItem] = await projectDataList.items
      .filter(`GtSiteUrl eq '${context.props.webPartContext.pageContext.web.absoluteUrl}'`)
      .select('Id')()

    const [ideaConfig] = (await SPDataAdapter.getIdeaConfiguration()).filter(
      (item) => item.title === context.props.ideaConfiguration
    )

    const ideaProcessingList = SPDataAdapter.portal.web.lists.getByTitle(ideaConfig.processingList)

    const [ideaProcessingItem] = await ideaProcessingList.items
      .filter(`GtIdeaProjectDataId eq '${projectDataItem.Id}'`)
      .select('Id, GtIdeaDecision')()
    if (ideaProcessingItem.GtIdeaDecision === 'Godkjent og synkronisert') {
      isSynced = true
    }
    return isSynced
  } catch (error) {
    return true
  }
}
