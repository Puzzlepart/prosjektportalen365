import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './InitialView.module.scss'
import { useInitialView } from './useInitialView'
import { Field, Textarea } from '@fluentui/react-components'
import { StatusActions } from './StatusActions'

export const InitialView: FC = () => {
  const { checklistItem, setComment, comment, actions } = useInitialView()
  if (!checklistItem) return null

  return (
    <div className={styles.root}>
      <Field
        label={`${checklistItem.id}. ${checklistItem.title}`}
        hint={strings.ChecklistCommentDescription}
      >
        <Textarea
          rows={4}
          value={comment}
          placeholder={strings.ChecklistCommentPlaceholder}
          onChange={(_, data) => setComment(data.value)}
        />
      </Field>
      <StatusActions actions={actions} />
    </div>
  )
}
