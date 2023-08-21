import { IBaseDialogProps } from '../@BaseDialog/types'
import { MessageBarType } from '@fluentui/react/lib/MessageBar'

export interface IErrorDialogProps extends IBaseDialogProps {
  /**
   * Error object
   */
  error: Error

  /**
   * Message type
   */
  messageType?: MessageBarType

  /**
   * On setup click
   */
  onSetupClick?(): void

  /**
   * Show stack as sub text in the dialog
   */
  showStackAsSubText?: boolean
}
