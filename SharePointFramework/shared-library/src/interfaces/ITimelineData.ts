import { ITimelineGroup, ITimelineItem } from './'

/**
 * Pairs timeline items with the groups they belong to.
 */
export interface ITimelineData {
  items: ITimelineItem[]
  groups: ITimelineGroup[]
}
