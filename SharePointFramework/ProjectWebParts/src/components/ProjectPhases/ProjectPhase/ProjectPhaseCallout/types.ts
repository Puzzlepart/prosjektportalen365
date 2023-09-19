import { PopoverProps } from '@fluentui/react-components'
import { ProjectPhaseModel } from 'pp365-shared-library/lib/models'

export interface IProjectPhaseCalloutProps extends Omit<PopoverProps, 'children'> {
  /**
   * Phase
   */
  phase?: ProjectPhaseModel

  /**
   * Target
   */
  target?: HTMLLIElement
}
