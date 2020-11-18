import { stringIsNullOrEmpty } from '@pnp/common'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import * as React from 'react'
import * as ReactMarkdown from 'react-markdown/with-html'
import { IUserMessageProps } from './types'
import styles from './UserMessage.module.scss'

export const UserMessage = ({
  className = styles.userMessage,
  text,
  messageBarType,
  onDismiss = null,
  style,
  hidden
}: IUserMessageProps) => {
  if (stringIsNullOrEmpty(text)) return null
  return (
    <div className={className} style={style} hidden={hidden}>
      <MessageBar messageBarType={messageBarType} onDismiss={onDismiss}>
        <ReactMarkdown escapeHtml={false} source={text} />
      </MessageBar>
    </div>
  )
}

export * from './types'
export { MessageBarType }
