import { ProjectPhaseModel } from 'pp365-shared/lib/models'
import { View } from '../Views'

export default interface IFooterProps {
  /**
   * New phase
   */
  newPhase: ProjectPhaseModel

  /**
   * Active phase
   */
  activePhase: ProjectPhaseModel

  /**
   * Current view
   */
  currentView: View

  /**
   * Whether the component is loading
   */
  isLoading: boolean

  /**
   * On change phase
   */
  onChangePhase: (phase: ProjectPhaseModel) => Promise<void>

  /**
   * On dismiss
   */
  onDismiss: (event: any, reload?: boolean) => void

  /**
   * On change view
   */
  onChangeView: (view: View) => void
}
