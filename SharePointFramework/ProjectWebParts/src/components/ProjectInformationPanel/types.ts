import { IProjectInformationProps } from '../ProjectInformation'
import { IBasePanelProps } from 'pp365-shared-library'

export interface IProjectInformationPanelProps
  extends IProjectInformationProps, Pick<IBasePanelProps, 'hidden'> {
  /**
   * On render function for the element that should toggle the panel visibility. A
   * callback function is passed to the element that should be called when the
   * panel should be toggled.
   */
  onRenderToggleElement?: (onToggle: React.MouseEventHandler<HTMLElement>) => JSX.Element

  /**
   * Props for the `Panel` component. See: `IBasePanelProps`
   *
   * It could be a good idea to specify the `headerText` and `onDismiss` props.
   */
  panelProps?: IBasePanelProps
}
