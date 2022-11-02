import { format } from '@fluentui/react'
import _ from 'lodash'
import {
  TimelineConfigurationListModel,
  TimelineContentListModel
} from 'pp365-portfoliowebparts/lib/models'
import strings from 'ProjectWebPartsStrings'
import { first } from 'underscore'
import { IProjectTimelineProps } from '../types'

/**
 * Fetch project data
 *
 * @param props Component properties for `ProjectTimeline`
 * @param timelineConfig Timeline configuration
 */
export async function fetchProjectData(
  props: IProjectTimelineProps,
  timelineConfig: TimelineConfigurationListModel[]
): Promise<TimelineContentListModel> {
  try {
    const projectData = await props.hubSite.web.lists
      .getByTitle(strings.ProjectsListName)
      .items.select('Id', 'GtStartDate', 'GtEndDate')
      .filter(`GtSiteId eq '${props.siteId}'`)
      .getAll()

    const config = _.find(timelineConfig, (col) => col.title === strings.ProjectLabel)
    return new TimelineContentListModel(
      props.siteId,
      props.webTitle,
      props.webTitle,
      strings.ProjectLabel,
      first(projectData)?.GtStartDate,
      first(projectData)?.GtEndDate
    ).setConfig(config)
  } catch (error) {
    throw new Error(
      format(strings.ProjectTimelineErrorFetchText, props.siteId, props.webTitle, error)
    )
  }
}
