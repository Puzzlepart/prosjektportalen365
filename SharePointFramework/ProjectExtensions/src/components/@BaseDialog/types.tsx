import { IDialogProps } from '@fluentui/react/lib/Dialog'

export interface IBaseDialogProps extends IDialogProps {
  /**
   * Version from extension manifest
   */
  version?: string
}
