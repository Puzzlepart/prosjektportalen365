
import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import * as strings from 'ProjectWebPartsStrings'

/**
 * Get next index
 * 
 * @param {IProjectPhaseChecklistItem[]} checklistItems Checklist items
 * @param {number} startIndex Start index
 */
export const getNextIndex = (checklistItems: IProjectPhaseChecklistItem[], startIndex: number = 0): number => {
  const [nextOpen] = [...checklistItems]
    .splice(startIndex)
    .filter(item => item.GtChecklistStatus === strings.StatusOpen)
  return checklistItems.indexOf(nextOpen)
}