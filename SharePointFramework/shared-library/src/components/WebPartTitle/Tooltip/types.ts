import { IIconProps } from '@fluentui/react'
import { HTMLAttributes } from 'react'

/**
 * Props for the Tooltip component.
 */
export interface ITooltipProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The text to display in the tooltip.
   */
  text: string

  /**
   * Props for the icon displayed next to the tooltip.
   */
  iconProps?: IIconProps
}
