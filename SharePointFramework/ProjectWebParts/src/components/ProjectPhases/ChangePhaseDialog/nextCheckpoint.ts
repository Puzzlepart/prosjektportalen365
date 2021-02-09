
import SPDataAdapter from 'data'
import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import strings from 'ProjectWebPartsStrings'
import { IChangePhaseDialogState } from './types'
import { View } from './Views'

export interface INextCheckpointParams {
    statusValue: string
    comment: string
    state?: IChangePhaseDialogState
}

/**
 * Get next index
 * 
 * @param {IProjectPhaseChecklistItem[]} checklistItems Checklist items
 * @param {number} startIndex Start index
 */
export const getNextIndex = (checklistItems: IProjectPhaseChecklistItem[], startIndex: number = 0): number => {
    const [nextOpen] = [...checklistItems]
      .splice(startIndex)
      .filter(item =>item.GtChecklistStatus === strings.StatusOpen)
    return checklistItems.indexOf(nextOpen)
  }

/**
 * Go to next checkpoint
 */
export const nextCheckpoint = async ({ statusValue, comment, state }: INextCheckpointParams): Promise<IChangePhaseDialogState> => {
    const checklistItems = [...state.checklistItems]
    const currentItem = checklistItems[state.currentIdx]
    const updatedValues: { [key: string]: string } = {
        GtComment: comment,
        GtChecklistStatus: statusValue
    }
    await SPDataAdapter.project.updateChecklistItem(
        strings.PhaseChecklistName,
        currentItem.ID,
        updatedValues
    )
    checklistItems[state.currentIdx] = { ...currentItem, ...updatedValues }
    const newState: IChangePhaseDialogState = { checklistItems }
    const nextIndex = getNextIndex(checklistItems, state.currentIdx + 1)
    if (nextIndex !== -1) newState.currentIdx = nextIndex
    else newState.view = View.Summary
    return newState
}