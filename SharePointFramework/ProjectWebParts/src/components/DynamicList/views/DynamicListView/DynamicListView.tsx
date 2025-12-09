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
import { customLightTheme } from 'pp365-shared-library'
import { useColumns } from '../../useColumns'
import { useFilteredData } from '../../useFilteredData'
import styles from './DynamicListView.module.scss'

/**
 * Renders list data in a multi-column table view with sorting, filtering, and selection.
 *
 * Features:
 * - Resizable columns with sticky headers
 * - Multi-select with row checkboxes
 * - Column sorting
 * - Click first column to drill down to single item view
 * - Column widths from ProjectContentColumns configuration
 * - Custom cell rendering via ItemColumn system
 */
export const DynamicListView: FC = () => {
  const context = useContext(DynamicListContext)
  const columns = useColumns()
  const filteredItems = useFilteredData()
  const fluentProviderId = useId('fp-dynamic-list')

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

  const items = useMemo(
    () =>
      filteredItems.map((item, index) => ({
        ...item,
        __rowId: index.toString()
      })),
    [filteredItems]
  )

  const {
    getRows,
    selection: { allRowsSelected, someRowsSelected, toggleAllRows, toggleRow, isRowSelected },
    sort: { getSortDirection, toggleColumnSort, sort },
    columnSizing_unstable: columnSizingState,
    tableRef
  } = useTableFeatures(
    {
      columns,
      items
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

  if (!context.state.data?.listItems?.length) {
    return <div>Ingen elementer å vise</div>
  }

  if (!columns.length) {
    return <div>Ingen kolonner å vise</div>
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.dynamicListView}>
        <div className={styles.scrollContainer}>
          <Table
            ref={tableRef}
            {...columnSizingState.getTableProps()}
            sortable
            aria-label='Dynamic list table'
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
                            isFirstColumn
                              ? { cursor: 'pointer', color: 'var(--colorBrandForeground1)' }
                              : undefined
                          }
                          onClick={
                            isFirstColumn
                              ? () => {
                                  context.setState({
                                    selectedItem: item,
                                    isDrilledDown: true
                                  })
                                }
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
