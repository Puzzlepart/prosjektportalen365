import { IDialogProps } from 'office-ui-fabric-react/lib/Dialog'
import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import { View } from './Views'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IChangePhaseDialogProps extends IDialogProps {}

export interface IChangePhaseDialogState {
  /**
   * Loading
   */
  loading?: boolean

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
  currentView?: View
}
