import SPDataAdapter from 'data/SPDataAdapter'
import {
  SPTimelineConfigurationItem,
  TimelineConfigurationModel
} from 'pp365-portfoliowebparts/lib/models'
import strings from 'ProjectWebPartsStrings'
import { IProjectTimelineProps } from '../types'

/**
 * Fetch timeline configuration
 *
 * @param props Component properties for `ProjectTimeline`
 */
export async function fetchTimelineConfiguration(props: IProjectTimelineProps) {
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
