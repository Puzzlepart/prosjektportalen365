import { MessageBarType } from '@fluentui/react'

export class CustomError extends Error {
  public constructor(error: Error, public type: MessageBarType, public customMessage: string = '') {
    super(error.message)
    this.name = error.name
    this.stack = error.stack
  }

  /**
   * Creates a `CustomError` object from an `Error` object. A custom message can 
   * also be specified as the third parameter.
   *
   * @param error Error object
   * @param type Type of error (MessageBarType)
   * @param message Custom message for the error
   */
  public static createError(error: Error, type: MessageBarType, message: string): CustomError {
    return new CustomError(error, type, message)
  }
}
