import { IProjectInformationProps } from '../ProjectInformation'
import { IBasePanelProps } from 'pp365-shared-library'

export interface IProjectInformationPanelProps extends IProjectInformationProps {
  /**
   * Keeps the panel closed; defaults to `true`. Without `onRenderToggleElement`
   * the panel opens when this turns `false`; with one, it only sets the initial
   * state and the toggle element opens and closes the panel.
   */
  hidden?: boolean

  /**
   * On render function for the element that should toggle the panel visibility. A
   * callback function is passed to the element that should be called when the
   * panel should be toggled.
   */
  onRenderToggleElement?: (onToggle: React.MouseEventHandler<HTMLElement>) => JSX.Element

  /**
   * Props for the `Panel` component. See: `IBasePanelProps`
   *
   * It could be a good idea to specify the `headerText` and `onClose` props.
   */
  panelProps?: IBasePanelProps
}
