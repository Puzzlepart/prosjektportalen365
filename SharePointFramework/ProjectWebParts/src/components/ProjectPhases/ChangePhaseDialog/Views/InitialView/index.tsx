import { TextField } from '@fluentui/react/lib/TextField'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './InitialView.module.scss'
import { StatusOptions } from './StatusOptions'
import { useInitialView } from './useInitialView'

export const InitialView: FC = () => {
  const { checklistItem, setComment, comment, actions } = useInitialView()
  if (!checklistItem) return null

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        {checklistItem.id}. {checklistItem.title}
      </div>
      <TextField
        className={styles.commentField}
        onChange={(_, newValue: string) => setComment(newValue)}
        placeholder={strings.ChecklistCommentPlaceholder}
        description={strings.ChecklistCommentDescription}
        multiline
        value={comment}
        resizable={false}
      />
      <StatusOptions actions={actions} />
    </div>
  )
}
