import { IMessageBarProps, MessageBarType } from '@fluentui/react'

/**
 * @category UserMessage
 */
export interface IUserMessageProps extends Omit<IMessageBarProps, 'messageBarType'> {
  /**
   * Text to show in the message
   *
   * NOTE: Supports markdown and HTML
   */
  text?: string

  /**
   * On click handler for the message
   */
  onClick?: (event: React.MouseEvent<any>) => void

  /**
   * On dismiss handler for the message
   */
  onDismiss?: () => void

  /**
   * Type (info, warning, error, etc...)
   */
  type?: MessageBarType

  /**
   * Container style
   */
  containerStyle?: React.CSSProperties

  /**
   * To flex the message center, speficy a min height
   */
  fixedCenter?: number

  /**
   * To reduce size of the message bar and make it compact
   */
  isCompact?: boolean
}
