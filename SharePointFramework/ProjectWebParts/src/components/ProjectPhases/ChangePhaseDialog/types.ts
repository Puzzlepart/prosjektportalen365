import { ChecklistItemModel } from 'pp365-shared-library/lib/models'
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
   * Is checklist mandatory
   */
  isChecklistMandatory?: boolean

  /**
   * Currently selected view
   */
  view?: View
}
