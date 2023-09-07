import { FluentProvider, useId, webLightTheme } from '@fluentui/react-components'
import { Alert } from '@fluentui/react-components/unstable'
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
  const fluentProviderId = useId('fluent-provider')

  const alertProps = useUserMessage(props)
  return (
    <FluentProvider
      id={fluentProviderId}
      theme={webLightTheme}
      className={[props.className, styles.root].filter(Boolean).join(' ')}
      style={props.containerStyle}
      hidden={props.hidden}
      onClick={props.onClick}
    >
      <Alert {...alertProps} className={styles.alert} intent={props.intent} action={props.action}>
        {props.text && (
          <ReactMarkdown linkTarget={props.linkTarget} rehypePlugins={[rehypeRaw]}>
            {props.text}
          </ReactMarkdown>
        )}
        {props.children && props.children}
      </Alert>
    </FluentProvider>
  )
}

UserMessage.defaultProps = {
  linkTarget: '_blank',
  style: {}
}

export * from './types'
