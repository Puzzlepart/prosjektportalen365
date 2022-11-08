import { IProgressIndicatorProps } from '@fluentui/react'
import { IBaseDialogProps } from '../@BaseDialog/types'

export interface IProgressDialogProps extends IBaseDialogProps {
  /**
   * Icon name
   */
  iconName?: string

  /**
   * Progress indicator props
   */
  progressIndicator: IProgressIndicatorProps
}
