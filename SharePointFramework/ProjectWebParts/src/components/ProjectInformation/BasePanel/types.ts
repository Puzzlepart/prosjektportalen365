import { IPanelProps } from '@fluentui/react'
import { ProjectInformationPanelType } from '../types'

export interface IBasePanelProps extends IPanelProps {
  /**
   * The type of the panel. Used for deciding if the
   * panel should be open or not.
   */
  $type?: ProjectInformationPanelType
}
