import { SearchBoxProps } from '@fluentui/react-components'
import { IProgramHub } from 'data/types'

export interface IProjectListProps {
  items: Record<string, any>[]
  /**
   * Site ids of the selected rows, across all groups. Given, the grid shows this selection and
   * nothing else, so a row removed from the list or a group collapsed and reopened cannot keep a
   * selection of its own.
   */
  selectedItems?: (string | number)[]

  /**
   * Called with the site ids of all selected rows after a change, across all groups.
   */
  onSelectionChange: (selectedItems: (string | number)[]) => void
  search: Pick<SearchBoxProps, 'placeholder'>
  renderLinks?: boolean
  hideCommands?: boolean
  programHubs?: IProgramHub[]
  defaultGroupsExpanded?: boolean
}
