import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow
} from '@fluentui/react-components'
import { SearchBox } from '@fluentui/react-search-preview'
import React, { FC, useContext } from 'react'
import { ProgramAdministrationContext } from '../context'
import styles from './ProjectList.module.scss'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'
import { Commands } from '../Commands'

export const ProjectList: FC<IProjectListProps> = (props) => {
  const context = useContext(ProgramAdministrationContext)
  const { items, columns, columnSizingOptions, defaultSortState, onSearch } = useProjectList(props)

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
    </div>
  )
}
