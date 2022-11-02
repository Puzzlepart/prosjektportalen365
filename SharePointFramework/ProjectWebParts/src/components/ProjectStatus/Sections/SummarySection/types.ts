import { IStatusElementProps } from 'components/ProjectStatus/StatusElement/types'
import { IBaseSectionProps } from '../BaseSection'

export interface ISummarySectionProps extends IBaseSectionProps, IStatusElementProps {
  showProjectInformation?: boolean
}
