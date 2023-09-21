import { IPanelProps } from '@fluentui/react'
import { IProjectInformationProps } from '../ProjectInformation'

export interface IProjectInformationPanelProps
  extends IProjectInformationProps,
    Pick<IPanelProps, 'hidden'> {
  /**
   * On render function for the element that should toggle the panel visibility. A
   * callback function is passed to the element that should be called when the
   * panel should be toggled.
   */
  onRenderToggleElement?: (onToggle: () => void) => JSX.Element

  /**
   * Props for the `Panel` component. See: `IPanelProps`
   *
   * It could be a good idea to specify the `headerText` and `onDismiss` props.
   */
  panelProps?: IPanelProps
}
