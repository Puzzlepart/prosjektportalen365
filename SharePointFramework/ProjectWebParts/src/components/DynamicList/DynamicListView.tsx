import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  FluentProvider,
  IdPrefixProvider,
  SortDirection,
  TableColumnSizingOptions,
  useId
} from '@fluentui/react-components'
import * as React from 'react'
import { FC, useContext, useMemo } from 'react'
import { DynamicListContext } from './context'
import { Toolbar, customLightTheme } from 'pp365-shared-library'
import { useColumns } from './useColumns'
import { useToolbarItems } from './useToolbarItems'
import { useFilteredData } from './useFilteredData'
import styles from './DynamicListView.module.scss'

export const DynamicListView: FC = () => {
  const context = useContext(DynamicListContext)
  const columns = useColumns()
  const filteredItems = useFilteredData()
  const { menuItems, farMenuItems } = useToolbarItems()
  const fluentProviderId = useId('fp-dynamic-list')

  const onSelection = (_: any, data: any) => {
    const selectedItemIds = Array.from(data.selectedItems)
    context.setState({ selectedItems: selectedItemIds })
  }

  const columnSizingOptions: TableColumnSizingOptions = useMemo(
    () =>
      columns.reduce(
        (options, col) => ({
          ...options,
          [col.columnId]: {
            defaultWidth: col.defaultWidth || 150,
            minWidth: col.minWidth || 100
          }
        }),
        {}
      ),
    [columns]
  )

  const defaultSortState = useMemo(
    () => ({
      sortColumn: columns[0]?.columnId || 'Title',
      sortDirection: 'ascending' as SortDirection
    }),
    [columns]
  )

  if (!context.state.data?.listItems?.length) {
    return <div>No items to display</div>
  }

  const itemsToDisplay = filteredItems

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.dynamicListView}>
        {context.props.showCommandBar && (
          <div className={styles.commandBar}>
            <Toolbar items={menuItems} farItems={farMenuItems} />
          </div>
        )}
        <DataGrid
          items={itemsToDisplay}
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
