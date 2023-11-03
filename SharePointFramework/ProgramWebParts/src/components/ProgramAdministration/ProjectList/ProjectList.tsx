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

export const ProjectList: FC<IProjectListProps> = (props) => {
  const context = useContext(ProgramAdministrationContext)
  const { items, columns, onSearch } = useProjectList(props)
  return (
    <div className={styles.projectList}>
      <SearchBox
        {...props.search}
        className={styles.searchBox}
        onChange={onSearch}
        contentAfter={{ onClick: () => onSearch(null, { value: '' }) }}
      />
      <DataGrid
        items={items}
        columns={columns}
        sortable
        resizableColumns
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
