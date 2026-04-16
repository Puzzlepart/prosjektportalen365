import { IColumn } from '@fluentui/react'
import { IFilterProps } from './Filter/types'
import { IFilterItemProps } from './FilterItem/types'

export interface IFilterPanelProps {
  /**
   * Whether the filter panel drawer is open
   */
  isOpen: boolean

  /**
   * Called when the panel should close (dismiss button, outside click, etc.)
   */
  onDismiss: () => void

  /**
   * Filters to display
   */
  filters: IFilterProps[]

  /**
   * On filter change function
   */
  onFilterChange: (column: IColumn, selectedItems: IFilterItemProps[]) => void

  /**
   * Currently active filters. Keys are field names, values are arrays of selected values.
   */
  activeFilters?: Record<string, string[]>

  /**
   * Called when the user wants to clear all active filters
   */
  onClearFilters?: () => void

  /**
   * Called when the user wants to remove a single filter value
   */
  onRemoveFilter?: (fieldName: string, value: string) => void

  /**
   * Header text for the panel
   */
  headerText?: string
}
