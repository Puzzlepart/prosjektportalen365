import { IPanelProps, IColumn } from '@fluentui/react'
import { IFilterProps } from './Filter/types'
import { IFilterItemProps } from './FilterItem/types'

export interface IFilterPanelProps extends IPanelProps {
  /**
   * Filters
   */
  filters: IFilterProps[]

  /**
   * On filter change function
   */
  onFilterChange: (column: IColumn, selectedItems: IFilterItemProps[]) => void

  /**
   * Id for the layer host
   */
  layerHostId?: string
}

export interface IFilterPanelState {
  /**
   * Filters
   */
  filters: IFilterProps[]
}
