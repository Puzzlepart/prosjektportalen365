import strings from 'ProjectWebPartsStrings'
import { ITimelineGroups } from '../types'

/** Selects project, category or type groups for the configured grouping mode. */
export function getSelectedGroups(groups: ITimelineGroups, defaultGroupBy: string) {
  switch (defaultGroupBy) {
    case strings.CategoryFieldLabel:
      return groups.categoryGroups
    case strings.TypeLabel:
      return groups.typeGroups
    default:
      return groups.projectGroups
  }
}
