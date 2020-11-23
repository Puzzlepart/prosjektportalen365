import { Phase } from 'models'

export interface IProjectPhaseProps {
  /**
   * Phase
   */
  phase: Phase

  /**
   * Is current phase
   */
  isCurrentPhase?: boolean

  /**
   * Change phase enabled
   */
  changePhaseEnabled?: boolean

  /**
   * On change phase handler
   */
  onChangePhaseHandler?: (phase: Phase) => void

  /**
   * On open callout
   */
  onOpenCallout: (target: any) => void
}
