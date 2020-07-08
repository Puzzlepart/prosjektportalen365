import * as React from 'react'
import { CheckListItem } from './CheckListItem'
import { ISummaryViewProps } from './types'
import styles from './SummaryView.module.scss'

/**
 * @component SummaryView
 */

export const SummaryView = (props: ISummaryViewProps) => {
    return (
        <div className={styles.summaryView}>
            <ul className={styles.checklist}>
                {props.checklistItems.map(item => (
                    <CheckListItem key={item.ID} item={item} />
                ))}
            </ul>
        </div >
    )
}

export default SummaryView
