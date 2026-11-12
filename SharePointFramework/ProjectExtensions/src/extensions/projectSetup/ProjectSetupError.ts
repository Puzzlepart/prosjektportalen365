import { parseErrorStack } from 'pp365-shared-library/lib/util/parseErrorStack'
import { MessageBarProps } from '@fluentui/react-components'
import { readableErrorDetails } from './readableError'

/** Setup failure with readable details and a dialog message intent. */
export class ProjectSetupError extends Error {
  /**
   * Builds a dialog-ready error from raw setup failure details.
   *
   * @param stack - Stack: a text, or the error the setup failed with
   */
  constructor(
    name: string,
    message: string,
    stack: any,
    public messageType: MessageBarProps['intent'] = 'error'
  ) {
    super(message)
    this.name = name
    this.stack = parseErrorStack(readableErrorDetails(stack))
  }
}
