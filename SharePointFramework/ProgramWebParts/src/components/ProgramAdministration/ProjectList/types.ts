import { SearchBoxProps } from '@fluentui/react-components'
import { IProgramHub } from 'data/types'

export interface IProjectListProps {
  items: Record<string, any>[]
  /**
   * Called with the site ids of the rows selected in the grid the user clicked in.
   */
  onSelectionChange: (selectedItems: (string | number)[]) => void
  search: Pick<SearchBoxProps, 'placeholder'>
  renderLinks?: boolean
  hideCommands?: boolean
  programHubs?: IProgramHub[]
  defaultGroupsExpanded?: boolean
}
