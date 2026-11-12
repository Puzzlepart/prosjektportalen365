import { MessageBarProps } from '@fluentui/react-components'

/**
 * Configures a message bar with optional markdown and HTML content.
 */
export interface IUserMessageProps extends MessageBarProps {
  /**
   * Title to show in the component, should be a descriptive title of the message
   */
  title?: string

  /**
   * Text to show in the component
   *
   * NOTE: Supports markdown and HTML
   */
  text?: string

  onClick?: (event: React.MouseEvent<any>) => void

  containerStyle?: React.CSSProperties

  /**
   * To flex the message center, speficy a min height
   */
  fixedCenter?: number

  /**
   * To reduce size of the message bar and make it compact
   */
  isCompact?: boolean

  linkTarget?: string
}
