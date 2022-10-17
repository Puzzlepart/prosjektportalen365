import { IPanelProps } from '@fluentui/react'
import { IProjectInformationProps } from '../ProjectInformation'

export interface IProjectInformationPanelProps extends IProjectInformationProps, Pick<IPanelProps, 'hidden'> {
  /**
   * On render function for the element that should toggle the panel visibility
   */
  onRenderToggleElement?: (onToggle: () => void) => JSX.Element

  /**
   * Props for the `<Panel />`
   */
  panelProps?: IPanelProps
}
