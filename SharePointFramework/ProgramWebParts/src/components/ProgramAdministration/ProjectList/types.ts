import { DataGridProps, SearchBoxProps } from '@fluentui/react-components'

export interface IProjectListProps {
  items: Record<string, any>[]
  onSelectionChange: DataGridProps['onSelectionChange']
  search: Pick<SearchBoxProps, 'placeholder'>
  renderLinks?: boolean
  hideCommands?: boolean
}
