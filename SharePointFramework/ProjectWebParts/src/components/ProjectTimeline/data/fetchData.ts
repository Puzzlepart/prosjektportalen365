import { IProjectTimelineProps, IProjectTimelineState } from '../types'
import { createTimelineGroups } from './createTimelineGroups'
import { fetchProjectData } from './fetchProjectData'
import { fetchTimelineConfiguration } from './fetchTimelineConfiguration'
import { fetchTimelineData } from './fetchTimelineData'
import { getSelectedGroups } from './getSelectedGroups'
import { transformItems } from './transformItems'
import SPDataAdapter from 'data/SPDataAdapter'

/**
 * Fetch data for ProjectTimeline
 *
 * @param props Component properties for `ProjectTimeline`
 *
 * @returns `ProjectTimeline` state
 */
export async function fetchData(
  props: IProjectTimelineProps
): Promise<Partial<IProjectTimelineState>> {
  try {
    const properties = await SPDataAdapter.project.getProjectInformationData()
    const timelineConfig = await fetchTimelineConfiguration(
      properties.templateParameters?.TimelineContentTypeId
    )
    const [timelineData, { project, projectId }] = await Promise.all([
      fetchTimelineData(
        props,
        timelineConfig,
        properties.templateParameters?.TimelineContentTypeId
      ),
      fetchProjectData(props, timelineConfig)
    ])

    const groups = createTimelineGroups(project, timelineConfig)
    const selectedGroups = getSelectedGroups(groups, props.defaultGroupBy)
    const items = transformItems(
      [...(timelineData?.timelineContentItems ?? []), project],
      selectedGroups,
      props
    )

    return {
      data: {
        items,
        projectId,
        groups: selectedGroups,
        listItems: timelineData?.timelineListItems ?? [],
        listColumns: timelineData?.columns ?? [],
        fields: timelineData?.timelineContentEditableFields ?? [],
        timelineContentTypeId: properties.templateParameters?.TimelineContentTypeId
      },
      timelineConfig,
      timelineContentTypeId: properties.templateParameters?.TimelineContentTypeId,
      groups
    }
  } catch (error) {
    return { error }
  }
}
