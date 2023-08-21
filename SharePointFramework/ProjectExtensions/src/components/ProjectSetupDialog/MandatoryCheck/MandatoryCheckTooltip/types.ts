import { IIconProps } from '@fluentui/react'

export interface IMandatoryCheckTooltipProps {
  /**
   * Text to be shown in the `TooltipHost`
   */
  text?: string

  /**
   * Props for the Lock icon (`iconName` defaults to **Lock**)
   */
  iconProps?: IIconProps
}
