import { MessageBarProps } from '@fluentui/react-components'

export class ErrorWithIntent extends Error {
  constructor(
    public message: string,
    public intent: MessageBarProps['intent'],
    public name = 'Error'
  ) {
    super(message)
  }
}
