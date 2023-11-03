import { DataGridProps } from '@fluentui/react-components'
import { SearchBoxProps } from '@fluentui/react-search-preview'

export interface IProjectListProps {
  items: Record<string, any>[]
  onSelectionChange: DataGridProps['onSelectionChange']
  search: Pick<SearchBoxProps, 'placeholder'>
}
