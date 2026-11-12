import { MessageBarProps } from '@fluentui/react-components'

/**
 * Carries a user-message intent alongside an error's text and name.
 */
export class ErrorWithIntent extends Error {
  constructor(
    public message: string,
    public intent: MessageBarProps['intent'],
    public name = 'Error'
  ) {
    super(message)
  }
}
