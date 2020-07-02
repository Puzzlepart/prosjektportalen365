import { stringIsNullOrEmpty } from '@pnp/common'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import * as strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { useState } from 'react'
import styles from './CheckListItem.module.scss'
import IChecklistItemProps from './IChecklistItemProps'

const STATUS_COLORS = {
    [strings.StatusOpen]: 'inherit',
    [strings.StatusClosed]: '#107c10',
    [strings.StatusNotRelevant]: '#e81123',
}

const STATUS_ICONS = {
    [strings.StatusOpen]: 'CircleRing',
    [strings.StatusClosed]: 'Completed',
    [strings.StatusNotRelevant]: 'Blocked',
}

/**
 * @component CheckListItem
 */

export const CheckListItem = ({ item }: IChecklistItemProps) => {
    const [commentHidden, setCommentHidden] = useState(true)

    const hasComment = !stringIsNullOrEmpty(item.GtComment)

    return (
        <li className={styles.checkListItem}>
            <div className={styles.iconContainer}>
                <Icon iconName={STATUS_ICONS[item.GtChecklistStatus]} style={{ color: STATUS_COLORS[item.GtChecklistStatus] }} />
            </div>
            <div className={styles.container}>
                <div className={styles.header} style={{ cursor: hasComment && 'pointer' }} onClick={() => hasComment && setCommentHidden(!commentHidden)}>
                    <div className={styles.title}>
                        <span>{item.ID}. {item.Title}</span>
                    </div>
                    <div className={styles.toggle} hidden={!hasComment}>
                        <Icon iconName={commentHidden ? 'ChevronUp' : 'ChevronDown'} />
                    </div>
                </div>
                <div className={styles.content} hidden={commentHidden}>
                    <div className={styles.comment}>
                        <span className={styles.label}>{strings.CommentLabel}</span> <span>{item.GtComment}</span>
                    </div>
                </div>
            </div>
        </li>
    )
}



