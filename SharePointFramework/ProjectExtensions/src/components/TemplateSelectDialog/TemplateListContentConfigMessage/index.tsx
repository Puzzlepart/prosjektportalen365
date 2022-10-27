import { format, MessageBar } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import ReactMarkdown from 'react-markdown'
import styles from './TemplateListContentConfigMessage.module.scss'
import { ITemplateListContentConfigMessageProps } from './types'

export const TemplateListContentConfigMessage: FC<ITemplateListContentConfigMessageProps> = ({
  selectedTemplate
}) => {
  return (
    <div className={styles.root}>
      <MessageBar>
        <ReactMarkdown>
          {format(strings.TemplateListContentConfigText, selectedTemplate?.text)}
        </ReactMarkdown>
      </MessageBar>
    </div>
  )
}
