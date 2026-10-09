import { SearchBoxProps } from '@fluentui/react-components'
import { IProgramHub } from 'data/types'

export interface IProjectListProps {
  /**
   * Names the list for screen readers.
   */
  title?: string

  items: Record<string, any>[]

  /**
   * Site ids of the selected rows, across all groups. Given, the list shows this selection and
   * nothing else, so a row removed from the list cannot keep a selection of its own. A row a
   * search hides keeps its place in the selection.
   */
  selectedItems?: (string | number)[]

  /**
   * Called with the site ids of all selected rows after a change, across all groups, the rows a
   * search hides included.
   */
  onSelectionChange: (selectedItems: (string | number)[]) => void
  search: Pick<SearchBoxProps, 'placeholder'>

  /**
   * Link the titles to the projects' sites.
   */
  renderLinks?: boolean
  hideCommands?: boolean

  /**
   * The program's hubs, which name the groups.
   */
  programHubs?: IProgramHub[]

  /**
   * Start every hub's group expanded; otherwise only those with fewer than ten projects.
   */
  defaultGroupsExpanded?: boolean
}
