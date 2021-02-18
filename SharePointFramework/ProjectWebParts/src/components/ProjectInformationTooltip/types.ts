import { ITooltipHostProps } from 'office-ui-fabric-react/lib/Tooltip'
import { IProjectInformationProps } from '../ProjectInformation'

export interface IProjectInformationTooltipProps extends IProjectInformationProps {
  /**
   * Props for the tooltip host
   */
  tooltipProps?: ITooltipHostProps
}
