import SPDataAdapter from 'data/SPDataAdapter'
import {
  SPTimelineConfigurationItem,
  TimelineConfigurationModel
} from 'pp365-shared-library/lib/models'
import resource from 'SharedResources'

/**
 * Fetches the timeline configuration from the SharePoint list.
 *
 * @returns A Promise that resolves to an array of `TimelineConfigurationModel` objects.
 */
export async function fetchTimelineConfiguration() {
  return (
    await SPDataAdapter.portalDataService.web.lists
      .getByTitle(resource.Lists_TimelineConfiguration_Title)
      .items.select(...new SPTimelineConfigurationItem().fields)
      .orderBy('GtSortOrder')()
  )
    .map((item) => new TimelineConfigurationModel(item))
    .filter(Boolean)
}
