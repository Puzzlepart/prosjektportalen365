import { IIconProps } from '@fluentui/react'
import { HTMLAttributes } from 'react'

/**
 * Props for the InfoTooltip component.
 */
export interface IInfoTooltipProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The text to display in the informational tooltip.
   */
  text: string

  /**
   * Props for the icon displayed next to the informational tooltip.
   */
  iconProps?: IIconProps
}
