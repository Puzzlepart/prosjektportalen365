import { IBaseComponentProps } from '../types'
import { ITimelineData } from 'pp365-shared-library/lib/interfaces'

export interface IResourceAllocationProps extends IBaseComponentProps {
  /**
   * Data source
   */
  dataSource: string

  /**
   * Background color for item
   */
  itemColor?: string

  /**
   * Background color for absence items
   */
  itemAbsenceColor?: string

  /**
   * Select properties
   */
  selectProperties?: string[]

  /**
   * Default timeframe start
   */
  defaultTimeframeStart?: string

  /**
   * Default timeframe end
   */
  defaultTimeframeEnd?: string
}

export interface IResourceAllocationState {
  /**
   * Active filters
   */
  activeFilters: { [key: string]: string[] }

  /**
   * Data
   */
  data?: ITimelineData

  /**
   * Error
   */
  error?: string

  /**
   * Loading
   */
  loading?: boolean
}
