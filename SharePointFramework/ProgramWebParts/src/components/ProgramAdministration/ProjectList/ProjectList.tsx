import { SearchBox } from '@fluentui/react-components'
import React, { FC, useContext, useMemo, useState } from 'react'
import { ProgramAdministrationContext } from '../context'
import styles from './ProjectList.module.scss'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'
import { Commands } from '../Commands'
import { isEmpty } from '@microsoft/sp-lodash-subset'
import { DataGridList, getFluentIcon, UserMessage } from 'pp365-shared-library'
import strings from 'ProgramWebPartsStrings'

/**
 * Groups with fewer projects than this start expanded.
 */
const AUTO_EXPAND_BELOW = 10

export const ProjectList: FC<IProjectListProps> = (props) => {
  const context = useContext(ProgramAdministrationContext)
  const {
    items,
    columns,
    defaultSortState,
    onSearch,
    searchTerm,
    groupedData,
    shouldEnableGrouping
  } = useProjectList(props)

  // Groups start open when asked to, or when they are small enough to scan at a glance.
  const initialExpandedGroups =
    shouldEnableGrouping && groupedData
      ? new Set(
          Object.keys(groupedData).filter(
            (hub) => props.defaultGroupsExpanded || groupedData[hub].length < AUTO_EXPAND_BELOW
          )
        )
      : new Set<string>()

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(initialExpandedGroups)

  // The selection is the owner's: each group's grid shows its share of it and reports the whole
  // selection back, so choosing in one group keeps what was chosen in the others.
  const selected = useMemo(() => new Set(props.selectedItems ?? []), [props.selectedItems])
  const selectionOfGroup = (groupItems: Record<string, any>[]) => {
    if (!props.selectedItems) return undefined
    return groupItems.map(({ SiteId }) => SiteId).filter((id) => selected.has(id))
  }
  const onGroupSelectionChange = (groupItems: Record<string, any>[]) => {
    const groupIds = new Set(groupItems.map(({ SiteId }) => SiteId))
    return (ids: (string | number)[]) =>
      props.onSelectionChange([...Array.from(selected).filter((id) => !groupIds.has(id)), ...ids])
  }

  const toggleGroup = (hubName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(hubName)) {
        next.delete(hubName)
      } else {
        next.add(hubName)
      }
      return next
    })
  }

  return (
    <div className={styles.projectList}>
      <div className={styles.header}>
        <div className={styles.search}>
          <SearchBox
            {...props.search}
            className={styles.searchBox}
            appearance='filled-lighter'
            size='large'
            onChange={onSearch}
            contentAfter={{ onClick: () => onSearch(null, { value: '' }) }}
          />
        </div>
        <div className={styles.commands} hidden={props.hideCommands}>
          <Commands />
        </div>
      </div>
      {!isEmpty(context.state.childProjects) || context.state.loading || props.hideCommands ? (
        shouldEnableGrouping && groupedData ? (
          <div className={styles.groupedList}>
            {Object.entries(groupedData).map(([hubName, groupItems]) => {
              // A search shows its few hits at once, whatever the groups' own state.
              const isExpanded = expandedGroups.has(hubName) || !!searchTerm
              return (
                <div key={hubName} className={styles.group}>
                  <div
                    className={styles.groupHeader}
                    onClick={() => toggleGroup(hubName)}
                    role='button'
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleGroup(hubName)
                      }
                    }}
                  >
                    {isExpanded ? getFluentIcon('ChevronDown') : getFluentIcon('ChevronRight')}
                    <h3>{hubName}</h3>
                    <span className={styles.groupCount}>({groupItems.length})</span>
                  </div>
                  {isExpanded && (
                    <DataGridList
                      items={groupItems}
                      columns={columns}
                      getRowId={({ SiteId }) => SiteId}
                      sortable
                      defaultSortState={defaultSortState}
                      selectionMode={
                        context.state.userHasManagePermission ? 'multiselect' : undefined
                      }
                      selectedItems={selectionOfGroup(groupItems)}
                      onSelectionChange={onGroupSelectionChange(groupItems)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <DataGridList
            items={items}
            columns={columns}
            getRowId={({ SiteId }) => SiteId}
            sortable
            defaultSortState={defaultSortState}
            selectionMode={context.state.userHasManagePermission ? 'multiselect' : undefined}
            selectedItems={props.selectedItems}
            onSelectionChange={props.onSelectionChange}
          />
        )
      ) : (
        <UserMessage
          title={strings.ProgramAdministrationEmptyTitle}
          text={strings.ProgramAdministrationEmptyMessage}
        />
      )}
    </div>
  )
}
