import { ProjectPhaseModel, IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import { View } from '../Views'

export default interface IBodyProps {
  /**
   * New phase
   */
  newPhase: ProjectPhaseModel

  /**
   * Active phase
   */
  activePhase: ProjectPhaseModel

  /**
   * Check list items
   */
  checklistItems: IProjectPhaseChecklistItem[]

  /**
   * Current index
   */
  currentIdx: number

  /**
   * Next checkpoint action callback
   */
  saveCheckPoint: (
    statusValue: string,
    commentsValue: string,
    updateStatus: boolean
  ) => Promise<void>

  /**
   * Current view
   */
  currentView: View

  /**
   * Is loading
   */
  isLoading: boolean

  /**
   * On change phase callback
   */
  onChangePhase: (phase: ProjectPhaseModel) => Promise<void>

  /**
   * On dismiss callback
   */
  onDismiss: (event: any, reload?: boolean) => void
}
