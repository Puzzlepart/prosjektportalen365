import React, { FC } from 'react'
import styles from './TemplateConfigMessage.module.scss'
import { ITemplateConfigMessageProps } from './types'
import { useTemplateConfigMessage } from './useTemplateConfigMessage'
import { UserMessage } from 'pp365-shared-library'

export const TemplateConfigMessage: FC<ITemplateConfigMessageProps> = (props) => {
  const messages = useTemplateConfigMessage(props)
  return (
    <div className={styles.root}>
      {messages.map((message, index) => (
        <div key={index} hidden={message.hidden}>
          <UserMessage key={index} text={message.text} intent={message.intent} />
        </div>
      ))}
    </div>
  )
}
