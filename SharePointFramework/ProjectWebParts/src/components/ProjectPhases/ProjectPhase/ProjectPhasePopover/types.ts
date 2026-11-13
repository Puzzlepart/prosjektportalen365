import { PopoverProps } from '@fluentui/react-components'
import { ProjectPhaseModel } from 'pp365-shared-library/lib/models'

/** Phase details and accessible heading for the phase popover. */
export interface IProjectPhasePopoverProps extends Omit<PopoverProps, 'children'> {
  phase?: ProjectPhaseModel

  target?: HTMLLIElement

  /**
   * Id of the phase's title, which names the popover
   */
  titleId?: string

  /**
   * Id of the phase's description, which describes the popover
   */
  descriptionId?: string
}
