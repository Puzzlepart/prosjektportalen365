import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './CheckListItem.module.scss'
import IChecklistItemProps from './types'
import { getFluentIcon } from 'pp365-shared-library'
import { Button, Text } from '@fluentui/react-components'
import { useCheckListItem } from './useCheckListItem'

export const CheckListItem: FC<IChecklistItemProps> = ({ item }) => {
  const { commentHidden, setCommentHidden, hasComment, statusIcon } = useCheckListItem(item)

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
