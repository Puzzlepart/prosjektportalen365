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
  TableColumnSizingOptions,
  Link
} from '@fluentui/react-components'
import * as React from 'react'
import { FC, useContext, useMemo, useCallback } from 'react'
import { DynamicListContext } from '../../context'
import { customLightTheme, UserMessage } from 'pp365-shared-library'
import styles from './ListView.module.scss'
import { IListViewProps } from './types'
import * as strings from 'ProjectWebPartsStrings'

/**
 * Base ListView component that provides common table rendering functionality
 * for both DynamicListView and DocumentLibraryView.
 */
export const ListView: FC<IListViewProps> = ({
  columns,
  items,
  isDocumentLibrary,
  onFirstColumnClick,
  emptyMessage = strings.DynamicList.NoItemsToShow,
  noColumnsMessage = strings.DynamicList.NoColumnsToShow,
  className
}) => {
  const context = useContext(DynamicListContext)
  const fluentProviderId = useId('fp-list-view')

  const selectedRows = useMemo(() => {
    const selectedIndices = new Set<TableRowId>()
    context.state.selectedItems?.forEach((originalIndex) => {
      const item = context.state.data?.listItems[originalIndex]
      if (item) {
        const filteredIndex = items.findIndex((i) => i === item)
        if (filteredIndex !== -1) {
          selectedIndices.add(filteredIndex)
        }
      }
    })
    return selectedIndices
  }, [context.state.selectedItems, context.state.data?.listItems, items])

  const handleSelectionChange = useCallback(
    (_e: any, data: { selectedItems: Set<TableRowId> }) => {
      const selectedItems = Array.from(data.selectedItems)
        .map((rowId) => {
          const index = Number(rowId)
          const item = items[index]
          return context.state.data.listItems.findIndex((i) => i === item)
        })
        .filter((idx) => idx !== -1)

      context.setState({ selectedItems })
    },
    [context, items]
  )

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
        selectedItems: selectedRows,
        onSelectionChange: handleSelectionChange
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

  const rows = useMemo(() => {
    const baseRows = getRows((row) => {
      const selected = isRowSelected(row.rowId)
      return {
        ...row,
        onClick: (e: React.MouseEvent) => toggleRow(e, row.rowId),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === ' ') {
            e.preventDefault()
            toggleRow(e, row.rowId)
          }
        },
        selected,
        appearance: selected ? ('brand' as const) : ('none' as const)
      }
    })

    const sortedRows = sort(baseRows)

    if (isDocumentLibrary) {
      return sortedRows.sort((a, b) => {
        const aIsFolder = a.item.FSObjType === 1
        const bIsFolder = b.item.FSObjType === 1

        if (aIsFolder && !bIsFolder) return -1
        if (!aIsFolder && bIsFolder) return 1

        return 0
      })
    }

    return sortedRows
  }, [getRows, isRowSelected, toggleRow, sort, isDocumentLibrary])

  const toggleAllKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === ' ') {
        toggleAllRows(e)
        e.preventDefault()
      }
    },
    [toggleAllRows]
  )

  if (!items.length) {
    return (
      <div style={{ padding: '0 32px' }}>
        <UserMessage title={strings.DynamicList.NoItemsFound} text={emptyMessage} intent='info' />
      </div>
    )
  }

  if (!columns.length) {
    return (
      <div style={{ padding: '0 32px' }}>
        <UserMessage
          title={strings.DynamicList.NoItemsFound}
          text={noColumnsMessage}
          intent='info'
        />
      </div>
    )
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={className}>
        <div className={styles.scrollContainer}>
          <Table
            ref={tableRef}
            {...columnSizingState.getTableProps()}
            sortable
            aria-label={strings.DynamicList.ListTable}
            noNativeElements={true}
          >
            <TableHeader>
              <TableRow>
                <TableSelectionCell
                  checked={allRowsSelected ? true : someRowsSelected ? 'mixed' : false}
                  onClick={toggleAllRows}
                  onKeyDown={toggleAllKeydown}
                  checkboxIndicator={{ 'aria-label': strings.DynamicList.SelectAll }}
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
              {rows.map(({ item, rowId, selected, onClick, onKeyDown, appearance }) => (
                <TableRow
                  key={rowId}
                  onClick={onClick}
                  onKeyDown={onKeyDown}
                  aria-selected={selected}
                  appearance={appearance}
                >
                  <TableSelectionCell
                    checked={selected}
                    checkboxIndicator={{ 'aria-label': strings.DynamicList.SelectRow }}
                  />
                  {columns.map((column, colIndex) => {
                    const isFirstColumn = colIndex === 0
                    const isBoolean = typeof (item as any)[column.columnId] === 'boolean'
                    const cellContent = column.renderCell
                      ? column.renderCell(item)
                      : (item as any)[column.columnId]

                    const isFolder = isDocumentLibrary && (item as any).FSObjType === 1
                    const isFile = isDocumentLibrary && !isFolder
                    const fileUrl = isFile ? (item as any).FileRef : null

                    return (
                      <TableCell
                        key={column.columnId}
                        {...columnSizingState.getTableCellProps(column.columnId)}
                      >
                        {isFirstColumn && onFirstColumnClick ? (
                          <TableCellLayout>
                            {isFile && fileUrl ? (
                              <Link href={fileUrl} target='_blank' rel='noopener noreferrer'>
                                {cellContent}
                              </Link>
                            ) : (
                              <Link
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onFirstColumnClick(item)
                                }}
                              >
                                {cellContent}
                              </Link>
                            )}
                          </TableCellLayout>
                        ) : (
                          <TableCellLayout>
                            {isBoolean
                              ? item[column.columnId]
                                ? strings.Yes
                                : strings.No
                              : cellContent}
                          </TableCellLayout>
                        )}
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
