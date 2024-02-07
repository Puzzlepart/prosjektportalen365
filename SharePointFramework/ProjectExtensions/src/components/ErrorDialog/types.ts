import { MessageBarIntent } from '@fluentui/react-components'
import { IBaseDialogProps } from '../@BaseDialog/types'

export interface IErrorDialogProps extends IBaseDialogProps {
  /**
   * Error object
   */
  error: Error

  /**
   * Intent of the message
   */
  intent?: MessageBarIntent

  /**
   * On setup click
   */
  onSetupClick?(): void

  /**
   * Show stack as sub text in the dialog
   */
  showStackAsSubText?: boolean
}
