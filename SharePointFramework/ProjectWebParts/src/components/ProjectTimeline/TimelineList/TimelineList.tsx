import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  FluentProvider,
  IdPrefixProvider
} from '@fluentui/react-components'
import * as React from 'react'
import { FC, useContext } from 'react'
import styles from './TimelineList.module.scss'
import { useTimelineList } from './useTimelineList'
import { ProjectTimelineContext } from '../context'
import { Toolbar, customLightTheme } from 'pp365-shared-library'

export const TimelineList: FC = () => {
  const context = useContext(ProjectTimelineContext)
  const {
    columns,
    menuItems,
    farMenuItems,
    columnSizingOptions,
    defaultSortState,
    onSelection,
    fluentProviderId
  } = useTimelineList()

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.timelineList}>
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
          selectedItems={context.state.selectedItems}
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
      </FluentProvider>
    </IdPrefixProvider>
  )
}
