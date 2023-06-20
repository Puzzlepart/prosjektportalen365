import strings from 'ProjectWebPartsStrings'
import { ITimelineGroups } from '../types'

/**
 * Get selected groups based on `defaultGroupBy`
 *
 * @param groups Timeline groups
 * @param defaultGroupBy Default group by
 */
export function getSelectedGroups(
  groups: ITimelineGroups,
  defaultGroupBy: string
) {
  switch (defaultGroupBy) {
    case strings.CategoryFieldLabel:
      return groups.categoryGroups
    case strings.TypeLabel:
      return groups.typeGroups
    default:
      return groups.projectGroups
  }
}
