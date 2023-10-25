import { format } from '@fluentui/react'
import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import { TimelineConfigurationModel, TimelineContentModel } from 'pp365-shared-library/lib/models'
import strings from 'ProjectWebPartsStrings'
import { IProjectTimelineProps } from '../types'
import '@pnp/sp/items/get-all'

/**
 * Fetch project data
 *
 * @param props Component properties for `ProjectTimeline`
 * @param timelineConfig Timeline configuration
 */
export async function fetchProjectData(
  props: IProjectTimelineProps,
  timelineConfig: TimelineConfigurationModel[]
) {
  try {
    const [projectData] = await SPDataAdapter.portal.web.lists
      .getByTitle(strings.ProjectsListName)
      .items.select('Id', 'GtStartDate', 'GtEndDate')
      .filter(`GtSiteId eq '${props.siteId}'`)
      .getAll()

    const config = _.find(timelineConfig, (col) => col.title === strings.ProjectLabel)
    const project = new TimelineContentModel(
      props.siteId,
      props.webTitle,
      props.webTitle,
      strings.ProjectLabel,
      projectData?.GtStartDate,
      projectData?.GtEndDate
    ).usingConfig(config)
    return { project, projectId: projectData.Id }
  } catch (error) {
    throw new Error(
      format(strings.ProjectTimelineErrorFetchText, props.siteId, props.webTitle, error)
    )
  }
}
