import { ChecklistItemModel } from 'pp365-shared/lib/models'
import { View } from './Views'

export interface IChangePhaseDialogState {
  /**
   * Check list items
   */
  checklistItems?: ChecklistItemModel[]

  /**
   * Currently selected index
   */
  currentIdx?: number

  /**
   * Currently selected view
   */
  view?: View
}
