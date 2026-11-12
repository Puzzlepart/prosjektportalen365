import { MessageBarIntent } from '@fluentui/react-components'
import { IBaseDialogProps } from '../@BaseDialog/types'

/** Error details and recovery actions shown in an extension dialog. */
export interface IErrorDialogProps extends IBaseDialogProps {
  error: Error

  intent?: MessageBarIntent

  onSetupClick?(): void

  /** Renders the stack as plain text instead of an announcing message bar. */
  showStackAsSubText?: boolean
}
