import { stringIsNullOrEmpty } from '@pnp/core'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useState } from 'react'
import styles from './CheckListItem.module.scss'
import IChecklistItemProps, { STATUS_COLORS } from './types'
import { getFluentIcon } from 'pp365-shared-library'
import { Button, Text } from '@fluentui/react-components'

export const CheckListItem: FC<IChecklistItemProps> = ({ item }) => {
  const [commentHidden, setCommentHidden] = useState(true)
  const hasComment = !stringIsNullOrEmpty(item.comment)

  const statusIcon = getFluentIcon(
    item.status === strings.StatusOpen
      ? 'Circle'
      : item.status === strings.StatusClosed
      ? 'CheckmarkCircle'
      : 'DismissCircle',
    { color: STATUS_COLORS[item.status], size: 24 }
  )

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
          <div className={styles.statusIcon}>{statusIcon}</div>
          <Text>
            {item.id}. {item.title}
          </Text>
        </div>
        <div hidden={!hasComment}>
          <Button
            appearance='transparent'
            size='small'
            icon={commentHidden ? getFluentIcon('ChevronUp') : getFluentIcon('ChevronDown')}
            title={commentHidden ? 'Vis kommentar' : 'Skjul kommentar'}
          />
        </div>
      </div>
      <div className={styles.comment} hidden={commentHidden}>
        <Text weight='semibold'>{strings.CommentLabel}: </Text>
        <Text>{item.comment}</Text>
      </div>
    </div>
  )
}
