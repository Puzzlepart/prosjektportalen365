import { IStatusElementProps } from '../../../ProjectStatus/StatusElement/types'
import { IBaseSectionProps } from '../BaseSection'

/** Layout and status presentation options for the report summary. */
export interface ISummarySectionProps extends IBaseSectionProps, IStatusElementProps {
  showProjectInformation?: boolean
}
