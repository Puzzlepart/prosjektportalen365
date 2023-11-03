import { SearchBoxProps } from '@fluentui/react-search-preview'
import { useMemo, useState } from 'react'
import { IProjectListProps } from './types'
import { useColumns } from './useColumns'

export function useProjectList(props: IProjectListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const items = useMemo(
    () => props.items.filter((item) => item.Title.toLowerCase().includes(searchTerm)),
    [props.items, searchTerm]
  )
  const columns = useColumns()

  const onSearch: SearchBoxProps['onChange'] = (_, data) => {
    setSearchTerm(data?.value?.toLowerCase() ?? '')
  }

  return { items, columns, onSearch, searchTerm }
}
