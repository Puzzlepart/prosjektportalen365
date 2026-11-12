import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import { TimelineConfigurationModel, TimelineContentModel } from 'pp365-shared-library/lib/models'
import strings from 'ProjectWebPartsStrings'
import { IProjectTimelineProps } from '../types'
import resource from 'SharedResources'
import { errorWithCause, format, isUnauthorizedError } from 'pp365-shared-library'

/** Reads the hub project row and creates the optional project-duration timeline item. */
export async function fetchProjectData(
  props: IProjectTimelineProps,
  timelineConfig: TimelineConfigurationModel[]
) {
  try {
    const [projectData] = await SPDataAdapter.portalDataService.web.lists
      .getByTitle(resource.Lists_Projects_Title)
      .items.select('Id', 'GtStartDate', 'GtEndDate')
      .filter(`GtSiteId eq '${props.siteId}'`)
      .top(1)()

    const config = _.find(
      timelineConfig,
      (col) => col.title === resource.TimelineConfiguration_Project_Title
    )
    const project = new TimelineContentModel(
      props.siteId,
      props.webTitle,
      props.webTitle,
      resource.TimelineConfiguration_Project_Title,
      projectData?.GtStartDate,
      projectData?.GtEndDate
    ).usingConfig(config)
    return { project, projectId: projectData.Id }
  } catch (error) {
    // Denied access is not a fault in the project's row: `fetchData` tells the user so.
    if (isUnauthorizedError(error)) throw error
    throw errorWithCause(
      format(strings.ProjectTimelineErrorFetchText, props.siteId, props.webTitle, error),
      error
    )
  }
}
