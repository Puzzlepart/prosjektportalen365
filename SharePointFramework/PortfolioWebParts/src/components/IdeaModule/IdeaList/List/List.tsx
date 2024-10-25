import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow
} from '@fluentui/react-components'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import * as React from 'react'
import styles from './List.module.scss'
import { useList } from './useList'
import { useIdeaModuleContext } from 'components/IdeaModule/context'

export const List = () => {
  const context = useIdeaModuleContext()
  const { columnSizingOptions, columns, defaultSortState } = useList()

  return (
    <div className={styles.list}>
      <DataGrid
        items={context.state.ideas.data.items as any[]}
        columns={columns}
        sortable
        defaultSortState={defaultSortState}
        resizableColumns
        columnSizingOptions={columnSizingOptions}
        containerWidthOffset={0}
        size={context.props.listSize}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<ProjectListModel>>
          {({ item, rowId }) => (
            <DataGridRow<ProjectListModel> key={rowId}>
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  )
}
