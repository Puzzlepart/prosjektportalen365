import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableSelectionCell,
  TableCellLayout,
  FluentProvider,
  IdPrefixProvider,
  useId,
  useTableFeatures,
  useTableSelection,
  useTableSort,
  useTableColumnSizing_unstable,
  TableRowId,
  TableColumnSizingOptions
} from '@fluentui/react-components'
import * as React from 'react'
import { FC, useContext, useMemo, useCallback } from 'react'
import { DynamicListContext } from '../../context'
import { customLightTheme, UserMessage } from 'pp365-shared-library'
import styles from './ListView.module.scss'
import { IListViewProps } from './types'

/**
 * Base ListView component that provides common table rendering functionality
 * for both DynamicListView and DocumentLibraryView.
 *
 * Features:
 * - Resizable columns with sticky headers
 * - Multi-select with row checkboxes
 * - Column sorting
 * - Column context menu support
 * - Custom cell rendering
 * - Configurable first column click behavior
 */
export const ListView: FC<IListViewProps> = ({
  columns,
  items,
  onFirstColumnClick,
  emptyMessage = 'Ingen elementer å vise',
  noColumnsMessage = 'Ingen kolonner å vise',
  className
}) => {
  const context = useContext(DynamicListContext)
  const fluentProviderId = useId('fp-list-view')

  const columnSizingOptions: TableColumnSizingOptions = useMemo(
    () =>
      columns.reduce(
        (options, col) => ({
          ...options,
          [col.columnId]: {
            idealWidth: col.maxWidth || 160,
            minWidth: col.minWidth || 120,
            defaultWidth: col.maxWidth || 160,
            maxWidth: col.maxWidth
          }
        }),
        {}
      ),
    [columns]
  )

  const tableItems = useMemo(
    () =>
      items.map((item, index) => ({
        ...item,
        __rowId: index.toString()
      })),
    [items]
  )

  const {
    getRows,
    selection: { allRowsSelected, someRowsSelected, toggleAllRows, toggleRow, isRowSelected },
    sort: { getSortDirection, toggleColumnSort, sort },
    columnSizing_unstable: columnSizingState,
    tableRef
  } = useTableFeatures(
    {
      columns: columns as any,
      items: tableItems
    },
    [
      useTableSelection({
        selectionMode: 'multiselect',
        defaultSelectedItems: new Set(context.state.selectedItems?.map(String) || [])
      }),
      useTableSort({
        defaultSortState: { sortColumn: columns[0]?.columnId, sortDirection: 'ascending' }
      }),
      useTableColumnSizing_unstable({
        columnSizingOptions,
        autoFitColumns: false
      })
    ]
  )

  const rows = sort(getRows())

  const handleToggleRow = useCallback(
    (e: React.MouseEvent, rowId: TableRowId) => {
      toggleRow(e, rowId)
      const selectedRows = rows
        .filter((row) => isRowSelected(row.rowId))
        .map((row) => Number(row.rowId))
      context.setState({ selectedItems: selectedRows })
    },
    [toggleRow, rows, isRowSelected, context]
  )

  const handleToggleAllRows = useCallback(
    (e: React.MouseEvent) => {
      toggleAllRows(e)
      const selectedRows = allRowsSelected ? [] : rows.map((row) => Number(row.rowId))
      context.setState({ selectedItems: selectedRows })
    },
    [toggleAllRows, allRowsSelected, rows, context]
  )

  if (!items.length) {
    return <UserMessage title='Ingen elementer funnet' text={emptyMessage} intent='info' />
  }

  if (!columns.length) {
    return <UserMessage title='Ingen kolonner funnet' text={noColumnsMessage} intent='info' />
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={className}>
        <div className={styles.scrollContainer}>
          <Table
            ref={tableRef}
            {...columnSizingState.getTableProps()}
            sortable
            aria-label='List table'
            noNativeElements={true}
          >
            <TableHeader>
              <TableRow>
                <TableSelectionCell
                  checked={allRowsSelected ? true : someRowsSelected ? 'mixed' : false}
                  onClick={handleToggleAllRows}
                  checkboxIndicator={{ 'aria-label': 'Velg alle' }}
                />
                {columns.map((column) => (
                  <TableHeaderCell
                    key={column.columnId}
                    {...columnSizingState.getTableHeaderCellProps(column.columnId)}
                    sortDirection={getSortDirection(column.columnId)}
                    onClick={(e) => toggleColumnSort(e, column.columnId)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      context.setState({
                        columnContextMenu: {
                          column: {
                            ...column,
                            isSorted: !!getSortDirection(column.columnId),
                            isSortedDescending: getSortDirection(column.columnId) === 'descending'
                          },
                          target: e.currentTarget as HTMLElement
                        }
                      })
                    }}
                  >
                    {column.renderHeaderCell ? column.renderHeaderCell() : column.columnId}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ item, rowId }) => (
                <TableRow key={rowId}>
                  <TableSelectionCell
                    checked={isRowSelected(rowId)}
                    onClick={(e) => handleToggleRow(e, rowId)}
                    checkboxIndicator={{ 'aria-label': 'Select row' }}
                    subtle
                  />
                  {columns.map((column, colIndex) => {
                    const isFirstColumn = colIndex === 0

                    return (
                      <TableCell
                        key={column.columnId}
                        {...columnSizingState.getTableCellProps(column.columnId)}
                      >
                        <TableCellLayout
                          style={
                            isFirstColumn && onFirstColumnClick
                              ? { cursor: 'pointer', color: 'var(--colorBrandForeground1)' }
                              : undefined
                          }
                          onClick={
                            isFirstColumn && onFirstColumnClick
                              ? () => onFirstColumnClick(item)
                              : undefined
                          }
                        >
                          {column.renderCell
                            ? column.renderCell(item)
                            : (item as any)[column.columnId]}
                        </TableCellLayout>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
