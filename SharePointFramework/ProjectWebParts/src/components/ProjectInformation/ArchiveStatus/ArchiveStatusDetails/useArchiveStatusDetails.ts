import React, { useState } from 'react'
import {
  createTableColumn,
  useTableFeatures,
  useTableSort,
  TableColumnDefinition,
  TableColumnId
} from '@fluentui/react-components'
import * as strings from 'ProjectWebPartsStrings'
import { IArchiveOperation } from '../../../../data/SPDataAdapter/types'

export type StatusFilter = 'all' | 'success' | 'pending' | 'failed'

/**
 * Highest-severity status across an operation's scopes
 * (error > warning > in-progress > success).
 *
 * NOTE: archive-log statuses are stored as the localized display string (see
 * `writeArchiveLogEntries`), so comparisons here are intentionally against
 * `strings.ArchiveLogStatus*`.
 */
export const primaryStatusOf = (operation: IArchiveOperation): string => {
  const statuses = (operation.scopes || []).map((s) => s.status)
  if (statuses.includes(strings.ArchiveLogStatusError)) return strings.ArchiveLogStatusError
  if (statuses.includes(strings.ArchiveLogStatusWarning)) return strings.ArchiveLogStatusWarning
  if (statuses.includes(strings.ArchiveLogStatusInProgress))
    return strings.ArchiveLogStatusInProgress
  return strings.ArchiveLogStatusSuccess
}

const operationFilter = (operation: IArchiveOperation, filter: StatusFilter): boolean => {
  if (filter === 'all') return true
  const statuses = (operation.scopes || []).map((s) => s.status)
  if (filter === 'success') return statuses.includes(strings.ArchiveLogStatusSuccess)
  if (filter === 'pending') return statuses.includes(strings.ArchiveLogStatusInProgress)
  if (filter === 'failed')
    return (
      statuses.includes(strings.ArchiveLogStatusError) ||
      statuses.includes(strings.ArchiveLogStatusWarning)
    )
  return true
}

const columns: TableColumnDefinition<IArchiveOperation>[] = [
  createTableColumn<IArchiveOperation>({
    columnId: 'time',
    compare: (a, b) => a.date.getTime() - b.date.getTime()
  }),
  createTableColumn<IArchiveOperation>({
    columnId: 'operation',
    compare: (a, b) => a.operation.localeCompare(b.operation)
  }),
  createTableColumn<IArchiveOperation>({
    columnId: 'status',
    compare: (a, b) => primaryStatusOf(a).localeCompare(primaryStatusOf(b))
  }),
  createTableColumn<IArchiveOperation>({
    columnId: 'documents',
    compare: (a, b) => a.documentCount - b.documentCount
  }),
  createTableColumn<IArchiveOperation>({
    columnId: 'lists',
    compare: (a, b) => a.listCount - b.listCount
  })
]

/**
 * Component logic for `ArchiveStatusDetails`: the status filter plus the sorted,
 * filtered rows for the operations table.
 */
export function useArchiveStatusDetails(operations: IArchiveOperation[]) {
  const [filter, setFilter] = useState<StatusFilter>('all')
  const filtered = operations.filter((op) => operationFilter(op, filter))

  const {
    sort: { getSortDirection, toggleColumnSort, sort },
    getRows
  } = useTableFeatures({ columns, items: filtered }, [
    useTableSort({ defaultSortState: { sortColumn: 'time', sortDirection: 'descending' } })
  ])
  const sortedRows = sort(getRows())

  const headerSortProps = (columnId: TableColumnId) => ({
    onClick: (e: React.MouseEvent) => toggleColumnSort(e, columnId),
    sortDirection: getSortDirection(columnId)
  })

  return { filter, setFilter, sortedRows, headerSortProps }
}
