import { IFilterItemProps } from '../FilterItem/types'
import { IListColumn } from '../../../types'

export interface IFilterProps {
  column: IListColumn
  items: IFilterItemProps[]
  defaultCollapsed?: boolean
  /**
   * Optional group label. Filters that share a `group` value are rendered
   * under a single section header in the filter panel. Filters without a
   * `group` are rendered above any grouped sections.
   */
  group?: string
  onFilterChange?: (column: IListColumn, selectedItems: IFilterItemProps[]) => void
}

export interface IFilterState {
  isCollapsed: boolean
  items: IFilterItemProps[]
}
