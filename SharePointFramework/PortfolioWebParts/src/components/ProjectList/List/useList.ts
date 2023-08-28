import { SortDirection } from '@fluentui/react-components'
import React from 'react'
import { useColumns } from './useColumns'

/**
 * A hook that provides the necessary data for rendering a list of projects.
 *
 * @returns An object containing the necessary data for rendering a list of projects.
 */
export function useList() {
  const refMap = React.useRef<Record<string, HTMLElement | null>>({})
  const columns = useColumns()

  const columnSizingOptions = columns.reduce(
    (options, col) => (
      (options[col.columnId] = {
        defaultWidth: 120
      }),
      options
    ),
    {}
  )

  const defaultSortState = { sortColumn: 'title', sortDirection: 'ascending' as SortDirection }

  return { refMap, columnSizingOptions, columns, defaultSortState } as const
}
