import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar'
import * as React from 'react'
import { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { IUserMessageProps } from './types'
import { useUserMessage } from './useUserMessage'

/**
 * A component that supports a MessageBar with markdown using react-markdown
 *
 * @category UserMessage
 */
export const UserMessage: FC<IUserMessageProps> = (props: IUserMessageProps) => {
  const { styles } = useUserMessage(props)
  return (
    <div
      id={props.id}
      className={props.className}
      style={props.containerStyle}
      hidden={props.hidden}
      onClick={props.onClick}
    >
      <MessageBar
        styles={styles}
        isMultiline={props.isMultiline}
        messageBarType={props.type}
        onDismiss={props.onDismiss}
        actions={props.actions}
      >
        {props.text && (
          <ReactMarkdown linkTarget='_blank' rehypePlugins={[rehypeRaw]}>
            {props.text}
          </ReactMarkdown>
        )}
        {props.children && props.children}
      </MessageBar>
    </div>
  )
}

export * from './types'
export * from './useMessage'
