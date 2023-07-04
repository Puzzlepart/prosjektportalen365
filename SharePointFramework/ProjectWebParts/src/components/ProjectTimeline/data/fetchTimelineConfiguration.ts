import SPDataAdapter from 'data/SPDataAdapter'
import {
  SPTimelineConfigurationItem,
  TimelineConfigurationModel
} from 'pp365-shared-library/lib/models'
import strings from 'ProjectWebPartsStrings'

export async function fetchTimelineConfiguration() {
  return (
    await SPDataAdapter.portal.web.lists
      .getByTitle(strings.TimelineConfigurationListName)
      .items.select(...new SPTimelineConfigurationItem().fields)
      .orderBy('GtSortOrder')
      .getAll()
  )
    .map((item) => new TimelineConfigurationModel(item))
    .filter(Boolean)
}
