import React, { FC } from 'react'
import styles from './Filter.module.scss'
import { IFilterProps } from './types'
import { useFilter } from './useFilter'
import { ChevronDown16Filled, ChevronUp16Filled } from '@fluentui/react-icons'

export const Filter: FC<IFilterProps> = (props) => {
  const { state, onToggleSectionContent, renderItems } = useFilter(props)

  return (
    <div className={styles.filter}>
      <div className={styles.sectionHeader} onClick={onToggleSectionContent}>
        <span>{props.column.name}</span>
        {state.isCollapsed ? <ChevronUp16Filled /> : <ChevronDown16Filled />}
      </div>
      <div className={styles.sectionContent} hidden={state.isCollapsed}>
        {renderItems()}
      </div>
    </div>
  )
}
