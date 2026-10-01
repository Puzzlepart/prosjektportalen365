import { parseErrorStack } from 'pp365-shared-library/lib/util/parseErrorStack'
import { MessageBarProps } from '@fluentui/react-components'

export class ProjectSetupError extends Error {
  /**
   * Creates a new instance of ProjectSetupError
   *
   * @param name - Name
   * @param message - Message
   * @param stack - Stack
   * @param messageType - Message type
   */
  constructor(
    name: string,
    message: string,
    stack: any,
    public messageType: MessageBarProps['intent'] = 'error'
  ) {
    super(message)
    this.name = name
    this.stack = parseErrorStack(stack)
  }
}
