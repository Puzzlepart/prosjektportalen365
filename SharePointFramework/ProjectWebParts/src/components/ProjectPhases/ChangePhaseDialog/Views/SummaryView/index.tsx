import React, { FC, useContext } from 'react'
import { ChangePhaseDialogContext } from '../../context'
import { CheckListItem } from './CheckListItem'
import styles from './SummaryView.module.scss'

export const SummaryView: FC = () => {
  const { state } = useContext(ChangePhaseDialogContext)
  return (
    <div className={styles.summaryView}>
      {state.checklistItems.map((item) => (
        <CheckListItem key={item.id} item={item} />
      ))}
    </div>
  )
}

export default SummaryView
