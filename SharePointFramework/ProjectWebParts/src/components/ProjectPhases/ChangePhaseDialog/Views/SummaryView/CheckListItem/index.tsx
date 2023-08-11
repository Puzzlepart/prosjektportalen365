import { Icon } from '@fluentui/react/lib/Icon'
import { stringIsNullOrEmpty } from '@pnp/core'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useState } from 'react'
import styles from './CheckListItem.module.scss'
import IChecklistItemProps, { STATUS_COLORS, STATUS_ICONS } from './types'

export const CheckListItem: FC<IChecklistItemProps> = ({ item }) => {
  const [commentHidden, setCommentHidden] = useState(true)
  const hasComment = !stringIsNullOrEmpty(item.comment)

  return (
    <li className={styles.checkListItem}>
      <div className={styles.iconContainer}>
        <Icon iconName={STATUS_ICONS[item.status]} style={{ color: STATUS_COLORS[item.status] }} />
      </div>
      <div className={styles.container}>
        <div
          className={styles.header}
          style={{ cursor: hasComment && 'pointer' }}
          onClick={() => hasComment && setCommentHidden(!commentHidden)}
        >
          <div className={styles.title}>
            <span>
              {item.id}. {item.title}
            </span>
          </div>
          <div className={styles.toggle} hidden={!hasComment}>
            <Icon iconName={commentHidden ? 'ChevronUp' : 'ChevronDown'} />
          </div>
        </div>
        <div className={styles.content} hidden={commentHidden}>
          <div className={styles.comment}>
            <span className={styles.label}>{strings.CommentLabel}</span> <span>{item.comment}</span>
          </div>
        </div>
      </div>
    </li>
  )
}
