import { MessageBarProps } from '@fluentui/react-components'

/**
 * Preserves an underlying error with a message intent and optional user-facing text.
 */
export class CustomError extends Error {
  public constructor(
    error: Error,
    public type: MessageBarProps['intent'],
    public customMessage: string = ''
  ) {
    super(error.message)
    this.name = error.name
    this.stack = error.stack
  }

  /**
   * Wraps an error with a message-bar intent and optional user-facing message.
   */
  public static createError(
    error: Error,
    type: MessageBarProps['intent'],
    message: string = ''
  ): CustomError {
    return new CustomError(error, type, message)
  }
}
