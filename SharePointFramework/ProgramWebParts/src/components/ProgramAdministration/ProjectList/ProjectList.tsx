import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  SearchBox
} from '@fluentui/react-components'
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons'
import React, { FC, useContext, useState } from 'react'
import { ProgramAdministrationContext } from '../context'
import styles from './ProjectList.module.scss'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'
import { Commands } from '../Commands'
import { isEmpty } from '@microsoft/sp-lodash-subset'
import { UserMessage } from 'pp365-shared-library'
import strings from 'ProgramWebPartsStrings'

export const ProjectList: FC<IProjectListProps> = (props) => {
  const context = useContext(ProgramAdministrationContext)
  const { items, columns, columnSizingOptions, defaultSortState, onSearch, groupedData, shouldEnableGrouping } = useProjectList(props)
  
  const initialExpandedGroups = props.defaultGroupsExpanded && shouldEnableGrouping
    ? new Set(Object.keys(groupedData))
    : new Set<string>()
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(initialExpandedGroups)

  const toggleGroup = (hubName: string) => {
    setExpandedGroups(prev => {
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
              const isExpanded = expandedGroups.has(hubName)
              return (
                <div key={hubName} className={styles.group}>
                  <div 
                    className={styles.groupHeader} 
                    onClick={() => toggleGroup(hubName)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleGroup(hubName)
                      }
                    }}
                  >
                    {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                    <h3>{hubName}</h3>
                    <span className={styles.groupCount}>({groupItems.length})</span>
                  </div>
                  {isExpanded && (
                    <DataGrid
                      items={groupItems}
                      columns={columns}
                      sortable
                      defaultSortState={defaultSortState}
                      resizableColumns
                      columnSizingOptions={columnSizingOptions}
                      containerWidthOffset={0}
                      selectionMode={context.state.userHasManagePermission ? 'multiselect' : undefined}
                      onSelectionChange={props.onSelectionChange}
                      getRowId={({ SiteId }) => SiteId}
                    >
                      <DataGridHeader>
                        <DataGridRow>
                          {({ renderHeaderCell }) => (
                            <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                          )}
                        </DataGridRow>
                      </DataGridHeader>
                      <DataGridBody<Record<string, any>>>
                        {({ item, rowId }) => (
                          <DataGridRow<Record<string, any>> key={rowId}>
                            {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                          </DataGridRow>
                        )}
                      </DataGridBody>
                    </DataGrid>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <DataGrid
            items={items}
            columns={columns}
            sortable
            defaultSortState={defaultSortState}
            resizableColumns
            columnSizingOptions={columnSizingOptions}
            containerWidthOffset={0}
            selectionMode={context.state.userHasManagePermission ? 'multiselect' : undefined}
            onSelectionChange={props.onSelectionChange}
            getRowId={({ SiteId }) => SiteId}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<Record<string, any>>>
              {({ item, rowId }) => (
                <DataGridRow<Record<string, any>> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
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
