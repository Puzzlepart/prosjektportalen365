import { ICalloutProps } from 'office-ui-fabric-react/lib/Callout'
import { ProjectPhaseModel } from 'pp365-shared/lib/models'

export interface IProjectPhaseCalloutProps extends ICalloutProps {
  /**
   * Phase mouse over
   */
  phase: IProjectPhaseMouseOver

  /**
   * Is the phase currently selected
   */
  isCurrentPhase: boolean

  /**
   * URL for the web
   */
  webUrl: string

  /**
   * Is the current user site admin
   */
  isSiteAdmin?: boolean

  /**
   * On change phase callback
   */
  onChangePhase: (phase: ProjectPhaseModel) => void
}

export interface IProjectPhaseMouseOver<Target = any> {
  /**
   * Target for the callout
   */
  target: Target

  /**
   * Phase model
   */
  model: ProjectPhaseModel
}

