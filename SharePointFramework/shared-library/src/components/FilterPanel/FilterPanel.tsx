import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerHeaderNavigation,
  DrawerBody,
  Button,
  SearchBox,
  useId,
  IdPrefixProvider,
  FluentProvider
} from '@fluentui/react-components'
import React, { FC, Fragment, useMemo, useState } from 'react'
import { Filter } from './Filter/Filter'
import { IFilterProps } from './Filter/types'
import { IFilterPanelProps } from './types'
import styles from './FilterPanel.module.scss'
import { customLightTheme } from '../../util'
import { UserMessage } from '../UserMessage'
import { ActiveFilters } from './ActiveFilters'
import { getFluentIcon } from '../../icons'
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
  const fluentProviderId = useId('fp-filter-panel')
  const [searchTerm, setSearchTerm] = useState('')
  const displayableFilters = props.filters?.filter((f) => f.items.length > 1) ?? []
  const { ungrouped, groups } = partitionFiltersByGroup(displayableFilters)

  const hasActiveFilters = useMemo(
    () =>
      props.activeFilters ? Object.values(props.activeFilters).some((v) => v.length > 0) : false,
    [props.activeFilters]
  )

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <OverlayDrawer
          open={props.isOpen}
          position='end'
          size='small'
          onOpenChange={(_, { open }) => {
            if (!open) props.onDismiss()
          }}
        >
          <DrawerHeader>
            <DrawerHeaderNavigation>
              <div className={styles.headerNav}>
                {props.onClearFilters && (
                  <Button
                    size='small'
                    appearance='subtle'
                    icon={getFluentIcon('FilterDismiss', { size: 16 })}
                    disabled={!hasActiveFilters}
                    onClick={props.onClearFilters}
                  >
                    {strings.ClearFiltersText}
                  </Button>
                )}
                <Button
                  appearance='subtle'
                  icon={getFluentIcon('Dismiss', { size: 20 })}
                  onClick={props.onDismiss}
                />
              </div>
            </DrawerHeaderNavigation>
            <DrawerHeaderTitle>{props.headerText ?? strings.FiltersString}</DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody>
            <div className={styles.filterPanel}>
              <SearchBox
                className={styles.searchBox}
                placeholder={strings.SearchFiltersPlaceholder}
                value={searchTerm}
                onChange={(_, data) => setSearchTerm(data?.value ?? '')}
                size='medium'
                appearance='filled-lighter'
              />
              <ActiveFilters
                filters={displayableFilters}
                onRemoveFilter={props.onRemoveFilter}
                onClearAll={props.onClearFilters}
              />
              {displayableFilters.length === 0 && (
                <UserMessage
                  title={strings.FilterPanelEmptyTitle}
                  text={strings.FilterPanelEmptyMessage}
                  intent='info'
                />
              )}
              {ungrouped.map((f) => (
                <Filter
                  {...f}
                  key={`u-${f.column.key}`}
                  searchTerm={searchTerm}
                  onFilterChange={props.onFilterChange}
                />
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
                      searchTerm={searchTerm}
                      onFilterChange={props.onFilterChange}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </DrawerBody>
        </OverlayDrawer>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
