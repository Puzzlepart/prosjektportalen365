import _ from 'lodash'
import { ChecklistItemModel } from 'pp365-shared-library/lib/models'
import * as strings from 'ProjectWebPartsStrings'

/**
 * Get next checklist item index.
 *
 * @param checklistItems Checklist items
 * @param startIndex Start index
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
