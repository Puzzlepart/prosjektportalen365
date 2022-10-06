import { IPanelProps } from 'office-ui-fabric-react'
import { IProjectInformationProps } from '../ProjectInformation'

export interface IProjectInformationPanelProps extends IProjectInformationProps {
  /**
   * Props for the tooltip host
   */
  panelProps?: IPanelProps
}
