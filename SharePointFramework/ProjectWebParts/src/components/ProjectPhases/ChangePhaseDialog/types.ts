import { IDialogProps } from 'office-ui-fabric-react/lib/Dialog'
import { ProjectPhaseModel, IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import { View } from './Views'

export interface IChangePhaseDialogProps extends IDialogProps {
  /**
   * The new phase
   */
  newPhase: ProjectPhaseModel

  /**
   * The active phase
   */
  activePhase: ProjectPhaseModel

  /**
   * On change phase
   */
  onChangePhase: (phase: ProjectPhaseModel) => Promise<void>
}

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
