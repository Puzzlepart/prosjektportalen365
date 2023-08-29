import { ITooltipProps } from './Tooltip'

/**
 * Props for the WebPartTitle component.
 */
export interface IWebPartTitleProps {
  /**
   * The title to display in the component.
   */
  title?: string

  /**
   * Props for the tooltip to display when hovering over the component.
   */
  tooltip?: ITooltipProps
}
