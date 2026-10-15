import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './CheckListItem.module.scss'
import IChecklistItemProps from './types'
import { getFluentIcon } from 'pp365-shared-library'
import { Button, Text } from '@fluentui/react-components'
import { useCheckListItem } from './useCheckListItem'

export const CheckListItem: FC<IChecklistItemProps> = ({ item }) => {
  const { commentHidden, setCommentHidden, hasComment, statusIcon, commentId } =
    useCheckListItem(item)

  return (
    <div
      className={styles.checkListItem}
      style={{
        cursor: hasComment && 'pointer',
        backgroundColor: !commentHidden && 'var(--colorSubtleBackgroundSelected)'
      }}
      onClick={() => hasComment && setCommentHidden(!commentHidden)}
    >
      <div className={styles.item}>
        <div className={styles.title}>
          <div className={styles.statusIcon} role='img' aria-label={item.status}>
            {statusIcon}
          </div>
          <Text>
            {item.id}. {item.title}
          </Text>
        </div>
        <div hidden={!hasComment}>
          <Button
            appearance='transparent'
            size='small'
            icon={commentHidden ? getFluentIcon('ChevronUp') : getFluentIcon('ChevronDown')}
            title={commentHidden ? strings.ShowCommentText : strings.HideCommentText}
            aria-label={commentHidden ? strings.ShowCommentText : strings.HideCommentText}
            aria-expanded={!commentHidden}
            aria-controls={commentId}
          />
        </div>
      </div>
      <div id={commentId} className={styles.comment} hidden={commentHidden}>
        <Text weight='semibold'>{strings.CommentLabel}: </Text>
        <Text>{item.comment}</Text>
      </div>
    </div>
  )
}
