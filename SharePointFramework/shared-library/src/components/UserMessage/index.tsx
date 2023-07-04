import { MessageBar } from '@fluentui/react'
import React, { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { IUserMessageProps } from './types'
import { useUserMessage } from './useUserMessage'
import styles from './UserMessage.module.scss'

/**
 * A component that supports a MessageBar with markdown using react-markdown
 *
 * @category UserMessage
 */
export const UserMessage: FC<IUserMessageProps> = (props: IUserMessageProps) => {
  const messageBarProps = useUserMessage(props)
  return (
    <div
      id={props.id}
      className={[props.className, styles.root].filter(Boolean).join(' ')}
      style={props.containerStyle}
      hidden={props.hidden}
      onClick={props.onClick}
    >
      <MessageBar
        {...messageBarProps}
        isMultiline={props.isMultiline}
        messageBarType={props.type}
        onDismiss={props.onDismiss}
        actions={props.actions}
      >
        {props.text && (
          <ReactMarkdown linkTarget={props.linkTarget} rehypePlugins={[rehypeRaw]}>
            {props.text}
          </ReactMarkdown>
        )}
        {props.children && props.children}
      </MessageBar>
    </div>
  )
}

UserMessage.defaultProps = {
  linkTarget: '_blank'
}

export * from './types'
export * from './useMessage'
