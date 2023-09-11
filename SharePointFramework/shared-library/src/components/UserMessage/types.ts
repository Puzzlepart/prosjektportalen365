import { AlertProps } from '@fluentui/react-components/dist/unstable'

/**
 * @category UserMessage
 */
export interface IUserMessageProps extends AlertProps {
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

  /**
   * Link target for markdown links
   */
  linkTarget?: string
}
