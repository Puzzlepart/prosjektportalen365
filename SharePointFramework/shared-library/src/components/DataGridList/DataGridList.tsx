import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  TableColumnSizingOptions
} from '@fluentui/react-components'
import React, { useMemo, useRef } from 'react'
import styles from './DataGridList.module.scss'
import { fitColumnWidths } from './fitColumnWidths'
import { IDataGridColumn, IDataGridListProps } from './types'
import { useContainerWidth } from './useContainerWidth'

/**
 * Width of Fluent's selection cell (`CELL_WIDTH` in `@fluentui/react-table`, not exported).
 */
const TABLE_SELECTION_CELL_WIDTH = 44

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
    emptyContent,
    fitColumnsToContainer
  } = props

  // The grid measures its own parent for its auto-fit; the fit here needs the width too, to hand
  // the grid ideal widths that already add up to it. A selection mode adds a checkbox cell of
  // Fluent's fixed width to every row, outside the columns, so only the rest is theirs to share:
  // sharing all of it put every row one cell past the container, whatever the columns did.
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef, fitColumnsToContainer)
  const selectionCellWidth = selectionMode ? TABLE_SELECTION_CELL_WIDTH : 0
  const columnSizingOptions = useMemo(
    () =>
      fitColumnsToContainer
        ? fitColumnWidths(columns, containerWidth - selectionCellWidth)
        : createColumnSizingOptions(columns),
    [columns, fitColumnsToContainer, containerWidth, selectionCellWidth]
  )
  // A changed set of columns remounts the grid, so its sort and sizing state start over rather
  // than pointing at columns that are gone.
  const columnsKey = columns.map((column) => column.columnId).join('|')

  if (emptyContent !== undefined && items.length === 0) return <>{emptyContent}</>

  const grid = (
    <DataGrid
      key={columnsKey}
      className={className ? `${styles.root} ${className}` : styles.root}
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
      size={size}
    >
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell }) => (
            <DataGridHeaderCell className={styles.headerCell}>
              {renderHeaderCell()}
            </DataGridHeaderCell>
          )}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<TItem>>
        {({ item, rowId }) => (
          <DataGridRow<TItem>
            key={rowId}
            onDoubleClick={onRowDoubleClick && (() => onRowDoubleClick(item))}
          >
            {({ renderCell }) => (
              <DataGridCell className={styles.cell}>{renderCell(item)}</DataGridCell>
            )}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  )

  // Fluent's column sizing sets `min-width: fit-content` on the grid, so where the columns do not
  // fit the grid grows past its parent rather than shrinking; the container scrolls it instead,
  // as the v8 list's content wrapper did.
  return (
    <div ref={containerRef} className={styles.container}>
      {grid}
    </div>
  )
}

DataGridList.displayName = 'DataGridList'
