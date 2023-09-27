import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow
} from '@fluentui/react-components'
import { Toolbar, ThemedComponent } from 'pp365-shared-library'
import * as React from 'react'
import { FC, useContext } from 'react'
import { ProjectTimelineContext } from '../context'
import styles from './TimelineList.module.scss'
import { useTimelineList } from './useTimelineList'

export const TimelineList: FC = () => {
  const context = useContext(ProjectTimelineContext)
  const { columns, menuItems, farMenuItems, columnSizingOptions, defaultSortState, onSelection } =
    useTimelineList()

  return (
    <ThemedComponent className={styles.timelineList}>
      {context.props.showTimelineListCommands && (
        <div className={styles.commandBar}>
          <div>
            <Toolbar items={menuItems} farItems={farMenuItems} />
          </div>
        </div>
      )}
      <DataGrid
        items={context.state.data.listItems}
        columns={columns}
        sortable
        defaultSortState={defaultSortState}
        selectionMode='multiselect'
        resizableColumns
        columnSizingOptions={columnSizingOptions}
        containerWidthOffset={0}
        onSelectionChange={onSelection}
        subtleSelection
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody>
          {({ item, rowId }) => (
            <DataGridRow key={rowId}>
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </ThemedComponent>
  )
}
