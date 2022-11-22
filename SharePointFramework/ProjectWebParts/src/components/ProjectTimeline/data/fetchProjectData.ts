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
    const [projectData] = await props.hubSiteContext.sp.web.lists
      .getByTitle(strings.ProjectsListName)
      .items
      .select('Id', 'GtStartDate', 'GtEndDate')
      .top(1)
      .filter(`GtSiteId eq '${props.spfxContext.pageContext.site.id.toString()}'`)()

    const config = _.find(timelineConfig, (col) => col.title === strings.ProjectLabel)
    return new TimelineContentModel(
      props.spfxContext.pageContext.site.id.toString(),
      props.spfxContext.pageContext.web.title,
      props.spfxContext.pageContext.web.title,
      strings.ProjectLabel,
      projectData?.GtStartDate,
      projectData?.GtEndDate
    ).usingConfig(config)
  } catch (error) {
    throw new Error(
      format(strings.ProjectTimelineErrorFetchText, props.spfxContext.pageContext.site.id.toString(), props.spfxContext.pageContext.web.title, error)
    )
  }
}
