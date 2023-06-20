import { format } from '@fluentui/react'
import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import {
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library/lib/models'
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
  timelineConfig: TimelineConfigurationModel[]
): Promise<TimelineContentModel> {
  try {
    const projectData = await SPDataAdapter.portal.web.lists
      .getByTitle(strings.ProjectsListName)
      .items.select('Id', 'GtStartDate', 'GtEndDate')
      .filter(`GtSiteId eq '${props.siteId}'`)
      .getAll()

    const config = _.find(
      timelineConfig,
      (col) => col.title === strings.ProjectLabel
    )
    return new TimelineContentModel(
      props.siteId,
      props.webTitle,
      props.webTitle,
      strings.ProjectLabel,
      first(projectData)?.GtStartDate,
      first(projectData)?.GtEndDate
    ).usingConfig(config)
  } catch (error) {
    throw new Error(
      format(
        strings.ProjectTimelineErrorFetchText,
        props.siteId,
        props.webTitle,
        error
      )
    )
  }
}
