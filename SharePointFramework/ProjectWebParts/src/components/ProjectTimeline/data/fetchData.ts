import { IProjectTimelineProps, IProjectTimelineState } from '../types'
import { createTimelineGroups } from './createTimelineGroups'
import { fetchProjectData } from './fetchProjectData'
import { fetchTimelineConfiguration } from './fetchTimelineConfiguration'
import { fetchTimelineData } from './fetchTimelineData'
import { getSelectedGroups } from './getSelectedGroups'
import { transformItems } from './transformItems'

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
    const timelineConfig = await fetchTimelineConfiguration()
    const [timelineData, { project, projectId }] = await Promise.all([
      fetchTimelineData(props, timelineConfig),
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
        fields: timelineData?.timelineContentEditableFields ?? []
      },
      timelineConfig,
      groups
    }
  } catch (error) {
    return { error }
  }
}
