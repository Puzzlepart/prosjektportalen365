import React, { FC, Fragment } from 'react'
import { Filter } from './Filter/Filter'
import { IFilterProps } from './Filter/types'
import { IFilterPanelProps } from './types'
import { BasePanel } from '../BasePanel'
import styles from './FilterPanel.module.scss'
import { UserMessage } from '../UserMessage'
import strings from 'SharedLibraryStrings'

/**
 * Splits filters into ungrouped and grouped buckets, preserving the original
 * order within each group. Ungrouped filters render first (no header), then
 * each group renders with its label as a section header.
 */
function partitionFiltersByGroup(filters: IFilterProps[]): {
  ungrouped: IFilterProps[]
  groups: { name: string; filters: IFilterProps[] }[]
} {
  const ungrouped: IFilterProps[] = []
  const groupOrder: string[] = []
  const groupMap = new Map<string, IFilterProps[]>()

  for (const filter of filters) {
    const groupName = filter.group
    if (!groupName) {
      ungrouped.push(filter)
      continue
    }
    let bucket = groupMap.get(groupName)
    if (!bucket) {
      bucket = []
      groupMap.set(groupName, bucket)
      groupOrder.push(groupName)
    }
    bucket.push(filter)
  }

  return {
    ungrouped,
    groups: groupOrder.map((name) => ({ name, filters: groupMap.get(name) ?? [] }))
  }
}

export const FilterPanel: FC<IFilterPanelProps> = (props) => {
  const displayableFilters = props.filters?.filter((f) => f.items.length > 1) ?? []
  const { ungrouped, groups } = partitionFiltersByGroup(displayableFilters)

  return (
    <BasePanel {...props} size='small'>
      <div className={styles.filterPanel}>
        {displayableFilters.length === 0 && (
          <UserMessage
            title={strings.FilterPanelEmptyTitle}
            text={strings.FilterPanelEmptyMessage}
            intent='info'
          />
        )}
        {ungrouped.map((f) => (
          <Filter {...f} key={`u-${f.column.key}`} onFilterChange={props.onFilterChange} />
        ))}
        {groups.map((group) => (
          <Fragment key={`g-${group.name}`}>
            <div className={styles.groupHeader} role='heading' aria-level={3}>
              {group.name}
            </div>
            {group.filters.map((f) => (
              <Filter
                {...f}
                key={`g-${group.name}-${f.column.key}`}
                onFilterChange={props.onFilterChange}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </BasePanel>
  )
}
