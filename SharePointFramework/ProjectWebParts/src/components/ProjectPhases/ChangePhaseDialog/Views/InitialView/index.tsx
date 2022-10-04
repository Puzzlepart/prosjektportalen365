import { TextField } from 'office-ui-fabric-react/lib/TextField'
import * as strings from 'ProjectWebPartsStrings'
import React, { useContext, useState } from 'react'
import { ChangePhaseDialogContext } from '../../context'
import getActions from './actions'
import styles from './InitialView.module.scss'
import { StatusOptions } from './StatusOptions'
import { IInitialViewProps } from './types'

export const InitialView = (props: IInitialViewProps) => {
  if (!props.checklistItem) return null
  const { nextChecklistItem } = useContext(ChangePhaseDialogContext)
  const [comment, setComment] = useState(props.checklistItem.GtComment || '')

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
        {props.checklistItem.ID}. {props.checklistItem.Title}
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
