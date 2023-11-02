import React, { FC } from 'react'
import styles from './TemplateConfigMessage.module.scss'
import { ITemplateConfigMessageProps } from './types'
import { useTemplateConfigMessage } from './useTemplateConfigMessage'
import { UserMessage } from 'pp365-shared-library'

export const TemplateConfigMessage: FC<ITemplateConfigMessageProps> = (props) => {
  const { hidden, text } = useTemplateConfigMessage(props)

  return (
    <div className={styles.root} hidden={hidden}>
      <UserMessage text={text} />
    </div>
  )
}
