import { parseErrorStack } from 'pp365-shared-library/lib/util/parseErrorStack'
import { MessageBarProps } from '@fluentui/react-components'
import { readableErrorDetails } from './readableError'

/** Setup failure with readable details and a dialog message intent. */
export class ProjectSetupError extends Error {
  /**
   * Builds a dialog-ready error from raw setup failure details.
   *
   * @param stack - Stack: a text, or the error the setup failed with
   * @param cause - What the setup failed with, where `stack` is a text about it; by default
   * `stack`, which is that error for a step that failed. Usage statistics read the failure's HTTP
   * status off it, never a text.
   */
  constructor(
    name: string,
    message: string,
    stack: any,
    public messageType: MessageBarProps['intent'] = 'error',
    cause: unknown = stack
  ) {
    super(message)
    this.name = name
    this.stack = parseErrorStack(readableErrorDetails(stack))
    // Not enumerable, as a native `cause` is not: it stays out of a spread and of JSON. Defined
    // here because the solutions compile against a `lib` without `new Error(message, { cause })`.
    Object.defineProperty(this, 'cause', {
      value: cause,
      writable: true,
      configurable: true,
      enumerable: false
    })
  }
}

/**
 * Whether `error` is a `ProjectSetupError`: the setup's own answer, with a text for the user.
 * Compiled to ES5, a subclass of `Error` constructs a plain `Error`, so `instanceof` never says
 * yes: a setup error is known by the message type each one has.
 *
 * @param error The caught value, of any shape
 */
export function isProjectSetupError(error: unknown): error is ProjectSetupError {
  return typeof (error as ProjectSetupError)?.messageType === 'string'
}
