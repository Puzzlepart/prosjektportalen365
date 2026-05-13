import React from 'react'
import {
  TableColumnDefinition,
  TableColumnId,
  TableColumnSizingOptions,
  TableFeaturesState,
  useTableColumnSizing_unstable,
  useTableFeatures,
  useTableSort
} from '@fluentui/react-components'
import { IArchiveItem } from './types'

type ArchiveTableState = TableFeaturesState<IArchiveItem>

interface IUseArchiveTableResult {
  sortedRows: ReturnType<ArchiveTableState['sort']['sort']>
  headerSortProps: (columnId: TableColumnId) => {
    onClick: (e: React.MouseEvent) => void
    sortDirection: ReturnType<ArchiveTableState['sort']['getSortDirection']>
  }
  columnSizing_unstable: ArchiveTableState['columnSizing_unstable']
  tableRef: ArchiveTableState['tableRef']
}

/**
 * Shared setup for the Documents and Lists tables in `ArchiveSelection`.
 * Returns ready-to-spread props for sortable + resizable Fluent v9 tables.
 */
export function useArchiveTable(
  items: IArchiveItem[],
  columns: TableColumnDefinition<IArchiveItem>[],
  columnSizingOptions: TableColumnSizingOptions
): IUseArchiveTableResult {
  const {
    getRows,
    columnSizing_unstable,
    tableRef,
    sort: { getSortDirection, toggleColumnSort, sort }
  } = useTableFeatures({ columns, items }, [
    useTableSort({ defaultSortState: { sortColumn: 'name', sortDirection: 'ascending' } }),
    useTableColumnSizing_unstable({ columnSizingOptions })
  ])
  const sortedRows = sort(getRows())
  const headerSortProps = (columnId: TableColumnId) => ({
    onClick: (e: React.MouseEvent) => toggleColumnSort(e, columnId),
    sortDirection: getSortDirection(columnId)
  })
  return { sortedRows, headerSortProps, columnSizing_unstable, tableRef }
}
