import { ICalloutProps } from '@fluentui/react/lib/Callout'
import { ProjectPhaseModel } from 'pp365-shared/lib/models'

export interface IProjectPhaseCalloutProps extends ICalloutProps {
  /**
   * Phase
   */
  phase?: ProjectPhaseModel
}
