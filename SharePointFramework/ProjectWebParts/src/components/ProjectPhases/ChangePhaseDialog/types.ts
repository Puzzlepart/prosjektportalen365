import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import { View } from './Views'

export interface IChangePhaseDialogState {
  /**
   * Check list items
   */
  checklistItems?: IProjectPhaseChecklistItem[]

  /**
   * Currently selected index
   */
  currentIdx?: number

  /**
   * Currently selected view
   */
  view?: View
}

export interface INextChecklistItemParams {
  statusValue: string
  comment: string
}
