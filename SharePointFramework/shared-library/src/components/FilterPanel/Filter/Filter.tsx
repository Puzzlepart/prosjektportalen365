import React, { FC } from 'react'
import styles from './Filter.module.scss'
import { IFilterProps } from './types'
import { useFilter } from './useFilter'
import { getFluentIcon } from '../../../icons'

export const Filter: FC<IFilterProps> = (props) => {
  const { state, visibleItems, onToggleSectionContent, renderItems } = useFilter(props)

  if (props.searchTerm && visibleItems.length === 0) return null

  return (
    <div className={styles.filter}>
      <div className={styles.sectionHeader} onClick={onToggleSectionContent}>
        <span>{props.column.name}</span>
        {state.isCollapsed
          ? getFluentIcon('ChevronUp', { size: 16 })
          : getFluentIcon('ChevronDown', { size: 16 })}
      </div>
      <div hidden={state.isCollapsed}>
        <div className={styles.sectionContent}>{renderItems()}</div>
      </div>
    </div>
  )
}
