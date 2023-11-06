import { Icon } from '@fluentui/react/lib/Icon'
import React, { FC } from 'react'
import styles from './Filter.module.scss'
import { IFilterProps } from './types'
import { useFilter } from './useFilter'

export const Filter: FC<IFilterProps> = (props) => {
  const { state, onToggleSectionContent, renderItems } = useFilter(props)

  return (
    <div className={styles.filter}>
      <div className={styles.filterSectionHeader} onClick={onToggleSectionContent}>
        <span className={styles.titleText}>{props.column.name}</span>
        <span className={styles.titleIcon}>
          <Icon iconName={state.isCollapsed ? 'ChevronUp' : 'ChevronDown'} />
        </span>
      </div>
      <div hidden={state.isCollapsed}>
        <ul className={styles.filterSectionContent}>{renderItems()}</ul>
      </div>
    </div>
  )
}
