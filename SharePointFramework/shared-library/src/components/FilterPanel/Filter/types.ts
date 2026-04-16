import { IColumn } from '@fluentui/react/lib/DetailsList'
import { IFilterItemProps } from '../FilterItem/types'

export interface IFilterProps {
  column: IColumn
  items: IFilterItemProps[]
  defaultCollapsed?: boolean
  /**
   * Optional group label. Filters that share a `group` value are rendered
   * under a single section header in the filter panel. Filters without a
   * `group` are rendered above any grouped sections.
   */
  group?: string
  /**
   * Search term to filter the items displayed in this filter section.
   * Items whose `name` does not match (case-insensitive) are hidden.
   */
  searchTerm?: string
  onFilterChange?: (column: IColumn, selectedItems: IFilterItemProps[]) => void
}

export interface IFilterState {
  isCollapsed: boolean
  items: IFilterItemProps[]
}
