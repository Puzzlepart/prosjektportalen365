import { TextField } from '@fluentui/react/lib/TextField'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext, useState } from 'react'
import { ChangePhaseDialogContext } from '../../context'
import getActions from './actions'
import styles from './InitialView.module.scss'
import { StatusOptions } from './StatusOptions'

export const InitialView:FC = () => {
  const { state } = useContext(ChangePhaseDialogContext)
  const checklistItem = state.checklistItems[state.currentIdx]
  if (!checklistItem) return null
  const { nextChecklistItem } = useContext(ChangePhaseDialogContext)
  const [comment, setComment] = useState(checklistItem.GtComment || '')

  /**
   * On next check list item
   *
   * @param statusValue Status value
   */
  const onNextChecklistItem = (statusValue: string) => {
    nextChecklistItem({
      GtChecklistStatus: statusValue,
      GtComment: comment
    })
    setComment('')
  }

  const actions = getActions(comment, onNextChecklistItem)

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        {checklistItem.ID}. {checklistItem.Title}
      </div>
      <TextField
        className={styles.commentField}
        onChange={(_, text: string) => setComment(text)}
        placeholder={strings.CommentLabel}
        multiline
        value={comment}
        resizable={false}
      />
      <StatusOptions actions={actions} />
    </div>
  )
}
