import { IBaseComponentProps } from '../types'
import * as moment from 'moment'
import { ITimelineData, ITimelineItem } from 'interfaces'
import { ProjectListModel } from 'models'
import { IFilterProps } from 'components/FilterPanel/Filter/types'

export interface IProjectTimelineProps extends IBaseComponentProps {
  /**
   * Timeline default start time
   */
  defaultTimeStart?: [number, moment.unitOfTime.DurationConstructor]

  /**
   * Timeline default end time
   */
  defaultTimeEnd?: [number, moment.unitOfTime.DurationConstructor]

  /**
   * Information text
   */
  infoText?: string

  /**
   *  Show Project deliveries
   */
  showProjectDeliveries?: boolean

  /**
   * DataSource name
   */
  dataSourceName?: string

  /**
   * Timeline configuration item title
   */
  configItemTitle?: string
}

export interface IProjectTimelineState {
  /**
   * Whether the component is loading
   */
  loading: boolean

  /**
   * Show filter panel
   */
  showFilterPanel?: boolean

  /**
   * Filters
   */
  filters?: IFilterProps[]

  /**
   * Active filters
   */
  activeFilters?: { [key: string]: string[] }

  /**
   * Projects
   */
  projects?: ProjectListModel[]

  /**
   * Data
   */
  data?: ITimelineData

  /**
   * Filtered data
   */
  filteredData?: ITimelineData

  /**
   * Timeline Configuration
   */
  timelineConfiguration?: any

  /**
   * Error
   */
  error?: Error

  /**
   * Item to show details for
   */
  showDetails?: { item: ITimelineItem; element: HTMLElement }
}
