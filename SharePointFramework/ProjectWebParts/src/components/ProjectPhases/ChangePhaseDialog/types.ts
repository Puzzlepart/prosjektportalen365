import { Phase, IPhaseChecklistItem } from 'models'
import { IDialogProps } from 'office-ui-fabric-react/lib/Dialog'
import { View } from './Views'

export interface IChangePhaseDialogProps extends IDialogProps {
  /**
   * The new phase
   */
  newPhase: Phase

  /**
   * The active phase
   */
  activePhase: Phase

  /**
   * On change phase
   */
  onChangePhase: (phase: Phase) => Promise<void>
}

export interface IChangePhaseDialogState {
  /**
   * Loading
   */
  loading?: boolean

  /**
   * Check list items
   */
  checklistItems?: IPhaseChecklistItem[]

  /**
   * Currently selected index
   */
  currentIdx?: number

  /**
   * Currently selected view
   */
  currentView?: View
}
