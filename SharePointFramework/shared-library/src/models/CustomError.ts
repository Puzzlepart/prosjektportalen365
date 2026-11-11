import { MessageBarProps } from '@fluentui/react-components'

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
   * Creates a `CustomError` object from an `Error` object. A custom message can
   * also be specified as the third parameter.
   *
   * @param error Error object
   * @param type Severity, rendered as the `intent` of a Fluent UI v9 `MessageBar`
   * @param message Custom message for the error (optional)
   */
  public static createError(
    error: Error,
    type: MessageBarProps['intent'],
    message: string = ''
  ): CustomError {
    return new CustomError(error, type, message)
  }
}
