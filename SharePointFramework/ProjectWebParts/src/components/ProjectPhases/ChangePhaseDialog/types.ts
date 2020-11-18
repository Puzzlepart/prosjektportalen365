import { Phase, IPhaseChecklistItem } from 'models'
import { IDialogProps } from 'office-ui-fabric-react/lib/Dialog'
import { View } from './Views'

export interface IChangePhaseDialogProps extends IDialogProps {
  /**
   * New phase
   */
  newPhase: Phase

  /**
   * Active phase
   */
  activePhase: Phase

  /**
   * On change phase
   */
  onChangePhase: (phase: Phase) => Promise<void>
}

export interface IChangePhaseDialogState {
  isLoading?: boolean
  checklistItems?: IPhaseChecklistItem[]
  currentIdx?: number
  currentView?: View
}
