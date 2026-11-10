import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import { TimelineConfigurationModel, TimelineContentModel } from 'pp365-shared-library/lib/models'
import strings from 'ProjectWebPartsStrings'
import { IProjectTimelineProps } from '../types'
import resource from 'SharedResources'
import { format, isUnauthorizedError } from 'pp365-shared-library'

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
    // A shielded project has no entry in the hub: the dates are on its properties item.
    const [projectData] = SPDataAdapter.isShieldedProject
      ? await SPDataAdapter.sp.web.lists
          .getByTitle(resource.Lists_ProjectProperties_Title)
          .items.select('Id', 'GtStartDate', 'GtEndDate')
          .top(1)()
      : await SPDataAdapter.portalDataService.web.lists
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
    // The ID links new timeline items to the project's entry in the hub, which a shielded
    // project does not have.
    return { project, projectId: SPDataAdapter.isShieldedProject ? undefined : projectData?.Id }
  } catch (error) {
    // Denied access is not a fault in the project's row: `fetchData` tells the user so.
    if (isUnauthorizedError(error)) throw error
    throw new Error(
      format(strings.ProjectTimelineErrorFetchText, props.siteId, props.webTitle, error)
    )
  }
}
