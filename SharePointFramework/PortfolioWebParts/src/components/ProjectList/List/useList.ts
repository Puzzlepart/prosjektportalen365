import { SortDirection } from '@fluentui/react-components'
import React, { useContext } from 'react'
import { ListContext } from './context'
import { useColumns } from './useColumns'

/**
 * A hook that provides the necessary data for rendering a list of projects.
 *
 * @returns An object containing the necessary data for rendering a list of projects.
 */
export function useList() {
  const context = useContext(ListContext)
  const refMap = React.useRef<Record<string, HTMLElement | null>>({})

  const columnSizingOptions = context.columns.reduce(
    (options, col) => (
      (options[col.columnId] = {
        defaultWidth: 120
      }),
      options
    ),
    {}
  )

  const columns = useColumns()

  const defaultSortState = { sortColumn: 'title', sortDirection: 'ascending' as SortDirection }

  return { refMap, columnSizingOptions, columns, defaultSortState } as const
}
