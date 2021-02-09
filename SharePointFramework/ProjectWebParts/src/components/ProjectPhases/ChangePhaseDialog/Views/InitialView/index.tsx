import { stringIsNullOrEmpty } from '@pnp/common'
import { IButtonProps } from 'office-ui-fabric-react/lib/Button'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import * as strings from 'ProjectWebPartsStrings'
import React from 'react'
import { IInitialViewProps } from './types'
import styles from './InitialView.module.scss'
import { StatusOptions } from './StatusOptions'

export const InitialView = (props: IInitialViewProps) => {
  if (!props.checklistItem) return null

  const [comment, setComment] = React.useState(props.checklistItem.GtComment || '')

  /**
   * Save checkpoint
   *
   * @param {string} status Status value
   */
  const saveCheckPoint = (status: string) => {
    props.saveCheckPoint(status, comment, true)
    setComment('')
  }

  const isCommentValid = !stringIsNullOrEmpty(comment) && comment.length >= 4
  const actions: IButtonProps[] = [
    {
      text: strings.StatusNotRelevant,
      disabled: props.isLoading || !isCommentValid,
      title: !isCommentValid
        ? strings.CheckpointNotRelevantTooltipCommentEmpty
        : strings.CheckpointNotRelevantTooltip,
      onClick: () => saveCheckPoint(strings.StatusNotRelevant)
    },
    {
      text: strings.StatusStillOpen,
      disabled: props.isLoading || !isCommentValid,
      title: !isCommentValid
        ? strings.CheckpointStillOpenTooltipCommentEmpty
        : strings.CheckpointStillOpenTooltip,
      onClick: () => saveCheckPoint(strings.StatusOpen)
    },
    {
      text: strings.StatusClosed,
      disabled: props.isLoading,
      title: strings.CheckpointDoneTooltip,
      onClick: () => saveCheckPoint(strings.StatusClosed)
    }
  ]

  return (
    <div className={styles.initialView}>
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
