import { IBasePanelProps } from '../BasePanel'
import { IFilterProps } from './Filter/types'
import { IFilterItemProps } from './FilterItem/types'
import { IListColumn } from '../../types'

export interface IFilterPanelProps extends IBasePanelProps {
  /**
   * Filters
   */
  filters: IFilterProps[]

  /**
   * On filter change function
   */
  onFilterChange: (column: IListColumn, selectedItems: IFilterItemProps[]) => void

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
