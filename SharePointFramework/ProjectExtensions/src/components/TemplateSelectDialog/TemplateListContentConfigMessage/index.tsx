import { format, MessageBar } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { FunctionComponent, useContext } from 'react'
import ReactMarkdown from 'react-markdown'
import { TemplateSelectDialogContext } from '../context'
import styles from './TemplateListContentConfigMessage.module.scss'

export const TemplateListContentConfigMessage: FunctionComponent = () => {
  const context = useContext(TemplateSelectDialogContext)
  return (
    <div className={styles.root}>
      <MessageBar>
        <ReactMarkdown>
          {format(strings.TemplateListContentConfigText, context.state.selectedTemplate?.text)}
        </ReactMarkdown>
      </MessageBar>
    </div>
  )
}
