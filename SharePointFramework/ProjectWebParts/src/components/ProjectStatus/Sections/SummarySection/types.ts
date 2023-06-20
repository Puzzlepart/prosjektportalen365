import { IStatusElementProps } from '../../../ProjectStatus/StatusElement/types'
import { IBaseSectionProps } from '../BaseSection'

export interface ISummarySectionProps
  extends IBaseSectionProps,
    IStatusElementProps {
  /**
   * Whether or not to show the project information component.
   */
  showProjectInformation?: boolean
}
