import { IBasePanelProps } from '../BasePanel'
import { IFilterProps } from './Filter/types'
import { IFilterItemProps } from './FilterItem/types'
import { IListColumn } from '../../types'

/**
 * Configures the filter drawer and its selection callback.
 */
export interface IFilterPanelProps extends IBasePanelProps {
  filters: IFilterProps[]

  onFilterChange: (column: IListColumn, selectedItems: IFilterItemProps[]) => void

  /**
   * Legacy layer-host ID, not used by the drawer-based filter panel.
   */
  layerHostId?: string
}

/**
 * Holds the filter sections available to a filter panel.
 */
export interface IFilterPanelState {
  filters: IFilterProps[]
}
