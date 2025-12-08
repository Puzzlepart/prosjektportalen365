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
  TableColumnDefinition,
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

export const DynamicListView: FC = () => {
  const context = useContext(DynamicListContext)
  const columns = useColumns()
  const filteredItems = useFilteredData()
  const fluentProviderId = useId('fp-dynamic-list')

  // Column sizing options
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

  // Convert items to include row IDs
  const items = useMemo(
    () =>
      filteredItems.map((item, index) => ({
        ...item,
        __rowId: index.toString()
      })),
    [filteredItems]
  )

  // Setup table features
  const {
    getRows,
    selection: {
      allRowsSelected,
      someRowsSelected,
      toggleAllRows,
      toggleRow,
      isRowSelected
    },
    sort: { getSortDirection, toggleColumnSort, sort },
    columnSizing_unstable: columnSizingState
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

  // Sync selection state
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
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <Table
            sortable
            aria-label="Dynamic list table"
            noNativeElements={true}
            style={{ minWidth: '100%' }}
          >
          <TableHeader>
            <TableRow>
              <TableSelectionCell
                checked={
                  allRowsSelected ? true : someRowsSelected ? 'mixed' : false
                }
                onClick={handleToggleAllRows}
                checkboxIndicator={{ 'aria-label': 'Select all rows' }}
                subtle
              />
              {columns.map((column) => {
                const headerCellProps = columnSizingState.getTableHeaderCellProps(column.columnId)
                return (
                  <TableHeaderCell
                    key={column.columnId}
                    sortDirection={getSortDirection(column.columnId)}
                    onClick={(e) => toggleColumnSort(e, column.columnId)}
                    {...headerCellProps}
                    style={{
                      ...headerCellProps.style,
                      overflow: 'hidden'
                    }}
                  >
                    {column.renderHeaderCell ? column.renderHeaderCell() : column.columnId}
                  </TableHeaderCell>
                )
              })}
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
                  const cellProps = columnSizingState.getTableCellProps(column.columnId)
                  const isFirstColumn = colIndex === 0

                  return (
                    <TableCell key={column.columnId} {...cellProps}>
                      <TableCellLayout
                        style={isFirstColumn ? { cursor: 'pointer', color: 'var(--colorBrandForeground1)' } : undefined}
                        onClick={isFirstColumn ? () => {
                          context.setState({
                            selectedItem: item,
                            isDrilledDown: true
                          })
                        } : undefined}
                      >
                        {column.renderCell ? column.renderCell(item) : (item as any)[column.columnId]}
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
