import { format } from '@fluentui/react'
import _ from 'lodash'
import {
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-portfoliowebparts/lib/models'
import strings from 'ProjectWebPartsStrings'
import { IProjectTimelineProps } from '../types'

/**
 * Fetch project data
 *
 * @param props Component properties for `ProjectTimeline`
 * @param timelineConfig Timeline configuration
 */
export async function fetchProjectData(
  props: IProjectTimelineProps,
  timelineConfig: TimelineConfigurationModel[]
): Promise<TimelineContentModel> {
  try {
    const [projectData] = await props.hubSite.sp.web.lists
      .getByTitle(strings.ProjectsListName)
      .items
      .select('Id', 'GtStartDate', 'GtEndDate')
      .top(1)
      .filter(`GtSiteId eq '${props.siteId}'`)()

    const config = _.find(timelineConfig, (col) => col.title === strings.ProjectLabel)
    return new TimelineContentModel(
      props.siteId,
      props.webTitle,
      props.webTitle,
      strings.ProjectLabel,
      projectData?.GtStartDate,
      projectData?.GtEndDate
    ).usingConfig(config)
  } catch (error) {
    throw new Error(
      format(strings.ProjectTimelineErrorFetchText, props.siteId, props.webTitle, error)
    )
  }
}
