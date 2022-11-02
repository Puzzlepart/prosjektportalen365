import { TimelineConfigurationListModel } from 'pp365-portfoliowebparts/lib/models'
import strings from 'ProjectWebPartsStrings'
import { IProjectTimelineProps } from '../types'

/**
 * Fetch timeline configuration
 *
 * @param props Component properties for `ProjectTimeline`
 */
export async function fetchTimelineConfiguration(props: IProjectTimelineProps) {
  return (
    await props.hubSite.web.lists
      .getByTitle(strings.TimelineConfigurationListName)
      .items
      .select(...Object.keys(new SPTimelineConfigurationItem()))
      .orderBy('GtSortOrder')
      .getAll()
  )
    .map((item) => {
      const model = new TimelineConfigurationListModel(
        item.GtSortOrder,
        item.Title,
        item.GtHexColor,
        item.GtHexColorText,
        item.GtTimelineCategory,
        item.GtElementType,
        item.GtShowElementPortfolio,
        item.GtShowElementProgram,
        item.GtTimelineFilter
      )
      return model
    })
    .filter(Boolean)
}
