import _ from 'lodash'
import { ChecklistItemModel } from 'pp365-shared-library/lib/models'
import * as strings from 'ProjectWebPartsStrings'

/**
 * Finds the next open checkpoint from the supplied start position.
 *
 * @returns Its index in the original checklist, or `-1` when none remains
 */
export const getNextIndex = (
  checklistItems: ChecklistItemModel[],
  startIndex: number = 0
): number => {
  const nextOpen = _.find(
    [...checklistItems].splice(startIndex),
    (item) => item.status === strings.StatusOpen
  )
  return checklistItems.indexOf(nextOpen)
}
