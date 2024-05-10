import { useMemo, useState } from 'react'
import { IProjectListProps } from './types'
import { useColumns } from './useColumns'
import { SearchBoxProps, SortDirection, TableColumnSizingOptions } from '@fluentui/react-components'

export function useProjectList(props: IProjectListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const items = useMemo(
    () => props.items.filter((item) => item.Title.toLowerCase().includes(searchTerm)),
    [props.items, searchTerm]
  )

  const columns = useColumns(props.renderLinks)

  const columnSizingOptions: TableColumnSizingOptions = columns.reduce(
    (options, col) => ({
      ...options,
      [col.columnId]: {
        defaultWidth: col.defaultWidth,
        minWidth: col.minWidth
      }
    }),
    {}
  )

  const defaultSortState = { sortColumn: 'title', sortDirection: 'ascending' as SortDirection }

  const onSearch: SearchBoxProps['onChange'] = (_, data) => {
    setSearchTerm(data?.value?.toLowerCase() ?? '')
  }

  return { items, columns, columnSizingOptions, defaultSortState, onSearch, searchTerm }
}
