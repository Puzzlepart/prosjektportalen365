import { IDetailsRowCheckProps, IIconProps } from '@fluentui/react'
import { ICheckLockedTooltipContent } from './CheckLockedTooltipContent/types'

export interface ICheckLockedProps
  extends IDetailsRowCheckProps,
    Pick<ICheckLockedTooltipContent, 'tooltipText'> {
  /**
   * Props for the Lock icon (`iconName` defaults to **Lock**)
   */
  iconProps?: IIconProps
}
