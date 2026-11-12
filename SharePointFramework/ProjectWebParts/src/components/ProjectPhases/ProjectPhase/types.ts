import { ProjectPhaseModel } from 'pp365-shared-library/lib/models'

/** Phase model and its place in the phase selector. */
export interface IProjectPhaseProps {
  phase: ProjectPhaseModel

  changePhaseEnabled?: boolean

  /**
   * On change phase handler
   *
   */
  onChangePhaseHandler?: (target: HTMLSpanElement) => void
}
