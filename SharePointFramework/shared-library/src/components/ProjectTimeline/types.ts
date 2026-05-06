import { IFilterProps } from '../../components/FilterPanel/Filter/types'
import { ITimelineData, ITimelineItem } from '../../interfaces'
import { ProjectColumn, ProjectListModel, TimelineConfigurationModel } from '../../models'
import { IBaseComponentProps } from '../types'
import { ITimelineProps } from './Timeline'

export interface IProjectTimelineProps
  extends IBaseComponentProps<any>,
    Pick<ITimelineProps, 'infoText'> {
  /**
   * Default timeframe start as a comma separated string (e.g. `4,months`).
   * Interpreted as months back in time from today.
   */
  defaultTimeframeStart?: string

  /**
   * Default timeframe end as a comma separated string (e.g. `4,months`).
   * Interpreted as months forward in time from today.
   */
  defaultTimeframeEnd?: string

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
