import { IProjectTimelineProps, IProjectTimelineState } from '../types'
import { createTimelineGroups } from './createTimelineGroups'
import { fetchProjectData } from './fetchProjectData'
import { fetchTimelineConfiguration } from './fetchTimelineConfiguration'
import { fetchTimelineData } from './fetchTimelineData'
import { getSelectedGroups } from './getSelectedGroups'
import { transformItems } from './transformItems'
import SPDataAdapter from 'data/SPDataAdapter'
import strings from 'ProjectWebPartsStrings'
import { CustomError, errorWithStatus, isUnauthorizedError } from 'pp365-shared-library'

/**
 * Loads project and timeline data with initial grouping, or returns a localized error state.
 * A fetch that fails gives the error to show, with the error that was caught as its `cause`.
 */
export async function fetchData(
  props: IProjectTimelineProps
): Promise<Partial<IProjectTimelineState>> {
  try {
    const properties = await SPDataAdapter.project.getProjectInformationData()

    if (SPDataAdapter.portalDataService?.isAvailable === false) {
      // `PortalDataService` swallowed the refusal that took the hub out of reach: with the status
      // it kept, the failure is counted as the denied permission it was. The text is the same.
      throw errorWithStatus(
        strings.ProjectTimelineNoHubAccessErrorText,
        SPDataAdapter.portalDataService.unavailableStatus
      )
    }

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
    console.error('[ProjectTimeline][fetchData] failed:', error)
    // A hub list the user may not read, such as `Prosjekter` or `Tidslinjeinnhold` for a member
    // of «Minimum lesetilganger på hub», gives the message about the missing access.
    const reason = isUnauthorizedError(error)
      ? new Error(strings.ProjectTimelineNoHubAccessErrorText)
      : error instanceof Error
        ? error
        : new Error(String(error))
    return {
      // The timeline shows the text; the cause lets the hook count the failure by the status
      // SharePoint answered with, which a `CustomError` does not keep.
      error: Object.assign(CustomError.createError(reason, 'warning'), { cause: error })
    }
  }
}
