import { IDetailsRowCheckProps, IIconProps } from '@fluentui/react'
import { ICheckLockedTooltipContent } from './CheckLockedTooltipContent/types'

export interface ICheckLockedProps extends IDetailsRowCheckProps {
  /**
   * Props for the Lock icon (`iconName` defaults to **Lock**)
   */
  iconProps?: IIconProps

  /**
   * Tooltip props
   */
  tooltip?: ICheckLockedTooltipContent
}
