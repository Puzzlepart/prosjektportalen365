import { MessageBar } from '@fluentui/react'
import React, { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import styles from './TemplateConfigMessage.module.scss'
import { ITemplateConfigMessageProps } from './types'
import { useTemplateConfigMessage } from './useTemplateConfigMessage'

export const TemplateConfigMessage: FC<ITemplateConfigMessageProps> = (
  props
) => {
  const { hidden, text } = useTemplateConfigMessage(props)

  return (
    <div className={styles.root} hidden={hidden}>
      <MessageBar>
        <ReactMarkdown>{text}</ReactMarkdown>
      </MessageBar>
    </div>
  )
}
