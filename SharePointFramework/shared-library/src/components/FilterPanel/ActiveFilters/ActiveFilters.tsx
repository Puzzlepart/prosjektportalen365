import { Button, CounterBadge } from '@fluentui/react-components'
import React, { FC, useMemo, useState } from 'react'
import { getFluentIcon } from '../../../icons'
import strings from 'SharedLibraryStrings'
import styles from './ActiveFilters.module.scss'
import { IActiveFilterEntry, IActiveFiltersProps } from './types'

export const ActiveFilters: FC<IActiveFiltersProps> = (props) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const activeEntries = useMemo<IActiveFilterEntry[]>(() => {
    return props.filters
      .filter((f) => f.items.some((item) => item.selected))
      .map((f) => ({
        fieldName: f.column.fieldName,
        columnName: f.column.name,
        values: f.items.filter((item) => item.selected).map((item) => item.name)
      }))
  }, [props.filters])

  const totalCount = activeEntries.reduce((acc, e) => acc + e.values.length, 0)

  if (totalCount === 0) return null

  return (
    <div className={`${styles.activeFilters} ${props.compact ? styles.compact : ''}`}>
      <div className={styles.header} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className={styles.headerLeft}>
          {strings.ActiveFiltersText}
          <CounterBadge count={totalCount} appearance='filled' size='small' color='brand' />
        </span>
        {isCollapsed
          ? getFluentIcon('ChevronUp', { size: 16 })
          : getFluentIcon('ChevronDown', { size: 16 })}
      </div>
      {!isCollapsed && (
        <>
          {activeEntries.map((entry) => (
            <div key={entry.fieldName} className={styles.filterGroup}>
              <span className={styles.filterGroupName}>{entry.columnName}</span>
              <div className={styles.filterValues}>
                {entry.values.map((value) => (
                  <span key={value} className={styles.filterTag}>
                    {value}
                    {props.onRemoveFilter && (
                      <button
                        className={styles.removeButton}
                        onClick={() => props.onRemoveFilter(entry.fieldName, value)}
                        title={strings.RemoveFilterText}
                      >
                        {getFluentIcon('Dismiss', { size: 12 })}
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {props.onClearAll && (
            <div style={{ padding: '0 6px' }}>
              <Button
                size='small'
                appearance='subtle'
                icon={getFluentIcon('FilterDismiss', { size: 16 })}
                onClick={props.onClearAll}
              >
                {strings.ClearFiltersText}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
