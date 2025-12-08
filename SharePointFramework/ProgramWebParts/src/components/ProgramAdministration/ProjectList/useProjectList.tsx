import { useMemo, useState } from 'react'
import { IProjectListProps } from './types'
import { useColumns } from './useColumns'
import { SearchBoxProps, SortDirection, TableColumnSizingOptions } from '@fluentui/react-components'

export function useProjectList(props: IProjectListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const shouldEnableGrouping = useMemo(() => {
    const uniqueHubs = new Set(
      props.items.map(item => item.HubSiteId).filter(Boolean)
    )
    
    return uniqueHubs.size > 1
  }, [props.items])

  const groupedData = useMemo(() => {
    if (!shouldEnableGrouping || !props.programHubs) return null

    const groups = props.items.reduce((acc, item) => {
      const hubSiteId = item.HubSiteId?.replace(/[{}]/g, '').toLowerCase()
      const hub = props.programHubs?.find(h => h.hubSiteId?.toLowerCase() === hubSiteId)
      const hubKey = hub?.title || hub?.url || item.HubSiteId
      if (!acc[hubKey]) {
        acc[hubKey] = []
      }
      acc[hubKey].push(item)
      return acc
    }, {} as Record<string, any[]>)

    if (searchTerm) {
      Object.keys(groups).forEach(hubKey => {
        groups[hubKey] = groups[hubKey].filter((item) => 
          item.Title.toLowerCase().includes(searchTerm)
        )
        if (groups[hubKey].length === 0) {
          delete groups[hubKey]
        }
      })
    }

    return groups
  }, [props.items, shouldEnableGrouping, props.programHubs, searchTerm])

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

  return { items, columns, columnSizingOptions, defaultSortState, onSearch, searchTerm, groupedData, shouldEnableGrouping }
}
