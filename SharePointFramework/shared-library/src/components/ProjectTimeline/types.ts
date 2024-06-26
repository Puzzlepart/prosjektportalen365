import * as moment from 'moment'
import { IFilterProps } from '../../components/FilterPanel/Filter/types'
import { ITimelineData, ITimelineItem } from '../../interfaces'
import { ProjectColumn, ProjectListModel, TimelineConfigurationModel } from '../../models'
import { IBaseComponentProps } from '../types'
import { ITimelineProps } from './Timeline'

export interface IProjectTimelineProps
  extends IBaseComponentProps<any>,
    Pick<ITimelineProps, 'infoText'> {
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
   * Columns
   */
  columns?: ProjectColumn[]

  /**
   * Data
   */
  data?: ITimelineData

  /**
   * Filtered data
   */
  filteredData?: ITimelineData

  /**
   * Timeline configuration
   */
  timelineConfig?: TimelineConfigurationModel[]

  /**
   * Error
   */
  error?: Error

  /**
   * Loading
   */
  loading?: boolean

  /**
   * Item to show details for
   */
  showDetails?: { item: ITimelineItem; element: HTMLElement }
}
