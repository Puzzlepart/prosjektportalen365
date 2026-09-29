import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  TableColumnSizingOptions
} from '@fluentui/react-components'
import React, { useMemo } from 'react'
import { IDataGridColumn, IDataGridListProps } from './types'

/**
 * Sizing options for the grid, from each column's widths.
 */
function createColumnSizingOptions(columns: IDataGridColumn[]): TableColumnSizingOptions {
  return columns.reduce<TableColumnSizingOptions>(
    (options, column) => ({
      ...options,
      [column.columnId]: {
        minWidth: column.minWidth,
        defaultWidth: column.defaultWidth ?? column.minWidth
      }
    }),
    {}
  )
}

/**
 * The Fluent UI v9 `DataGrid` as the solutions use it: sortable and resizable columns, optional
 * selection, and rows that can be "invoked" by double-click.
 *
 * This is the one shared list on v9. The project list and the timeline list ran the same grid
 * with the same code around it, and the lists converted in slice 6 repeated it again; this is that
 * code once. It takes columns as `IDataGridColumn` — a column definition plus widths — which
 * `createDataGridColumns` produces from the solutions' `IListColumn`. Lists that need grouping or a
 * sticky header stay on the v8 hub in PortfolioWebParts (Decision A).
 */
export function DataGridList<TItem = any>(props: IDataGridListProps<TItem>) {
  const {
    items,
    columns,
    getRowId,
    sortable,
    defaultSortState,
    selectionMode,
    selectedItems,
    onSelectionChange,
    subtleSelection,
    resizableColumns = true,
    size,
    onRowDoubleClick,
    className,
    emptyContent
  } = props

  const columnSizingOptions = useMemo(() => createColumnSizingOptions(columns), [columns])
  // A changed set of columns remounts the grid, so its sort and sizing state start over rather
  // than pointing at columns that are gone.
  const columnsKey = columns.map((column) => column.columnId).join('|')

  if (emptyContent !== undefined && items.length === 0) return <>{emptyContent}</>

  return (
    <DataGrid
      key={columnsKey}
      className={className}
      items={items}
      columns={columns}
      getRowId={getRowId}
      sortable={sortable}
      defaultSortState={defaultSortState}
      selectionMode={selectionMode}
      selectedItems={selectedItems as Set<string | number>}
      onSelectionChange={
        onSelectionChange && ((_event, data) => onSelectionChange(Array.from(data.selectedItems)))
      }
      subtleSelection={subtleSelection}
      resizableColumns={resizableColumns}
      columnSizingOptions={columnSizingOptions}
      containerWidthOffset={0}
      size={size}
    >
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<TItem>>
        {({ item, rowId }) => (
          <DataGridRow<TItem>
            key={rowId}
            onDoubleClick={onRowDoubleClick && (() => onRowDoubleClick(item))}
          >
            {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  )
}

DataGridList.displayName = 'DataGridList'
