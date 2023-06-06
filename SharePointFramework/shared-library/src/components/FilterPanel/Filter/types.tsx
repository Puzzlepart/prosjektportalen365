import { IColumn } from '@fluentui/react/lib/DetailsList'
import { IFilterItemProps } from '../FilterItem/types'

export interface IFilterProps {
  column: IColumn
  items: IFilterItemProps[]
  defaultCollapsed?: boolean
  onFilterChange?: (column: IColumn, selectedItems: IFilterItemProps[]) => void
}

export interface IFilterState {
  isCollapsed: boolean
  items: IFilterItemProps[]
}
