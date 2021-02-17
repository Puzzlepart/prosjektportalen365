import { IBaseComponentProps } from '../IBaseComponentProps'
import * as moment from 'moment'
import { ITimelineData, ITimelineItem } from 'interfaces'

export interface IResourceAllocationProps extends IBaseComponentProps {
  /**
   * Data source
   */
  dataSource: string

  /**
   * Background color for item
   */
  itemBgColor?: string

  /**
   * Background color for absence items
   */
  itemAbsenceBgColor?: string

  /**
   * Default time start
   */
  defaultTimeStart?: [number, moment.unitOfTime.DurationConstructor]

  /**
   * Default time end
   */
  defaultTimeEnd?: [number, moment.unitOfTime.DurationConstructor]

  /**
   * Select properties
   */
  selectProperties?: string[]
}

export interface IResourceAllocationState {
  /**
   * Whether the component is loading
   */
  loading: boolean

  /**
   * Show filter panel
   */
  showFilterPanel: boolean

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
   * Item to show show details for
   */
  showDetails?: { data: ITimelineItem; element: HTMLElement }
}
