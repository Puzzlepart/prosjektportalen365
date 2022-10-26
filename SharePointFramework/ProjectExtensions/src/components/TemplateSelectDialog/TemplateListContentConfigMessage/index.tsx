import { MessageBar, MessageBarType, format } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { FunctionComponent } from 'react'
import ReactMarkdown from 'react-markdown'
import { ITemplateListContentConfigMessageProps } from './types'
import styles from './TemplateListContentConfigMessage.module.scss'

export const TemplateListContentConfigMessage: FunctionComponent<ITemplateListContentConfigMessageProps> = ({
  selectedTemplate
}) => {
  return (
    <div className={styles.root}>
      <MessageBar messageBarType={MessageBarType.info}>
        <ReactMarkdown>{format(strings.TemplateListContentConfigText, selectedTemplate.text)}</ReactMarkdown>
      </MessageBar>
    </div>
  )
}
