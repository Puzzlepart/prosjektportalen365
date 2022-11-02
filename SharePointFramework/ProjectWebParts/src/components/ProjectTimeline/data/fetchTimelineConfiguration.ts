import { TimelineConfigurationListModel } from 'pp365-portfoliowebparts/lib/models'
import strings from 'ProjectWebPartsStrings'
import { IProjectTimelineProps } from '../types'

/**
 * Get timeline configuration
 *
 * @param props Component properties for `ProjectTimeline`
 */
export async function fetchTimelineConfiguration(props: IProjectTimelineProps) {
  return (
    await props.hubSite.web.lists
      .getByTitle(strings.TimelineConfigurationListName)
      .items.select(
        'Title',
        'GtSortOrder',
        'GtHexColor',
        'GtTimelineCategory',
        'GtElementType',
        'GtShowElementPortfolio',
        'GtShowElementProgram',
        'GtTimelineFilter'
      )
      .orderBy('GtSortOrder')
      .getAll()
  )
    .map((item) => {
      const model = new TimelineConfigurationListModel(
        item.GtSortOrder,
        item.Title,
        item.GtHexColor,
        item.GtTimelineCategory,
        item.GtElementType,
        item.GtShowElementPortfolio,
        item.GtShowElementProgram,
        item.GtTimelineFilter
      )
      return model
    })
    .filter((p) => p)
}
