import { ProjectPhaseModel } from 'pp365-shared/lib/models'

export interface IProjectPhaseProps {
  /**
   * Phase
   */
  phase: ProjectPhaseModel

  /**
   * Change phase enabled
   */
  changePhaseEnabled?: boolean

  /**
   * On change phase handler
   *
   * @param target Target
   */
  onChangePhaseHandler?: (target: HTMLSpanElement) => void
}
