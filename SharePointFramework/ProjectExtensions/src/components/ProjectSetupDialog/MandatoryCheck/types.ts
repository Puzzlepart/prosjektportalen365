import { IDetailsRowCheckProps, IIconProps } from '@fluentui/react'
import { IMandatoryCheckTooltipProps } from './MandatoryCheckTooltip/types'

export interface IMandatoryCheckProps extends IDetailsRowCheckProps {
  /**
   * Props for the Lock icon (`iconName` defaults to **Lock**)
   */
  iconProps?: IIconProps

  /**
   * Tooltip props
   */
  tooltip?: IMandatoryCheckTooltipProps
}
