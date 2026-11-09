import {
  FluentProvider,
  IdPrefixProvider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  useId
} from '@fluentui/react-components'
import React, { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { IUserMessageProps } from './types'
import { useUserMessage } from './useUserMessage'
import styles from './UserMessage.module.scss'
import { customLightTheme, withDefaults } from '../../util'

const USER_MESSAGE_DEFAULT_PROPS: Partial<IUserMessageProps> = {
  linkTarget: '_blank',
  style: {}
}

/**
 * A component that supports a MessageBar with markdown using react-markdown
 *
 * @category UserMessage
 */
export const UserMessage: FC<IUserMessageProps> = (incomingProps: IUserMessageProps) => {
  const props = withDefaults(incomingProps, USER_MESSAGE_DEFAULT_PROPS)
  const fluentProviderId = useId('fp-user-message')
  const messageProps = useUserMessage(props)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider
        theme={customLightTheme}
        className={[props.className, styles.root].filter(Boolean).join(' ')}
        style={props.containerStyle}
        hidden={props.hidden}
        onClick={props.onClick}
      >
        <MessageBar {...messageProps} className={styles.message} intent={props.intent}>
          <MessageBarBody>
            {props.title && <MessageBarTitle>{props.title}</MessageBarTitle>}
            {props.text && (
              <ReactMarkdown linkTarget={props.linkTarget} rehypePlugins={[rehypeRaw]}>
                {props.text}
              </ReactMarkdown>
            )}
            {props.children && props.children}
          </MessageBarBody>
        </MessageBar>
      </FluentProvider>
    </IdPrefixProvider>
  )
}

export * from './types'
