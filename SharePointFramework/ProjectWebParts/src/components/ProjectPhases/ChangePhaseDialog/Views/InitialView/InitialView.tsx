import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './InitialView.module.scss'
import { useInitialView } from './useInitialView'
import { Field, Label, Textarea } from '@fluentui/react-components'
import { StatusActions } from './StatusActions/StatusActions'
import { format } from 'pp365-shared-library'

export const InitialView: FC = () => {
  const { checklistItem, checklistItems, setComment, comment, isCommentRequired, actions } =
    useInitialView()
  if (!checklistItem) return null

  return (
    <div className={styles.root}>
      {/* The checkpoints as steps, not tabs: no panel belongs to a checkpoint, and choosing one
          did nothing. */}
      <ol className={styles.steps} role='list' aria-label={strings.Aria.ChecklistStepsLabel}>
        {checklistItems.map((item) => (
          <li
            key={item.id}
            className={item.id === checklistItem.id ? styles.currentStep : styles.step}
            aria-current={item.id === checklistItem.id ? 'step' : undefined}
            title={format(strings.PhaseCheckListItem, item.id)}
          >
            {item.id}
          </li>
        ))}
      </ol>
      <Label weight='semibold'>{checklistItem.title}</Label>
      <Field
        label={strings.CommentLabel}
        hint={isCommentRequired ? strings.ChecklistCommentDescription : undefined}
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
