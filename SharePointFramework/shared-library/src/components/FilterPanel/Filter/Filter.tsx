import React, { FC } from 'react'
import styles from './Filter.module.scss'
import { IFilterProps } from './types'
import { useFilter } from './useFilter'
import { getFluentIcon } from '../../../icons'

export const Filter: FC<IFilterProps> = (props) => {
  const { state, onToggleSectionContent, renderItems, contentId } = useFilter(props)

  return (
    <div className={styles.filter}>
      <button
        type='button'
        className={styles.sectionHeader}
        aria-expanded={!state.isCollapsed}
        aria-controls={contentId}
        onClick={onToggleSectionContent}
      >
        <span>{props.column.name}</span>
        {state.isCollapsed
          ? getFluentIcon('ChevronUp', { size: 16 })
          : getFluentIcon('ChevronDown', { size: 16 })}
      </button>
      <div id={contentId} hidden={state.isCollapsed}>
        <div className={styles.sectionContent}>{renderItems()}</div>
      </div>
    </div>
  )
}
