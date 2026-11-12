import { IFilterProps } from '../../components/FilterPanel/Filter/types'
import { ITimelineData, ITimelineItem } from '../../interfaces'
import { ProjectColumn, ProjectListModel, TimelineConfigurationModel } from '../../models'
import { IBaseComponentProps } from '../types'
import { ITimelineProps } from './Timeline'

/**
 * Configures the project timeline's data source and initial date window.
 */
export interface IProjectTimelineProps
  extends IBaseComponentProps<any>, Pick<ITimelineProps, 'infoText'> {
  /**
   * Amount and Moment duration unit to move backward from today, e.g. `4,months`.
   */
  defaultTimeframeStart?: string

  /**
   * Amount and Moment duration unit to move forward from today, e.g. `4,months`.
   */
  defaultTimeframeEnd?: string

  infoText?: string

  showProjectDeliveries?: boolean

  dataSourceName?: string

  configItemTitle?: string
}

/**
 * Tracks loaded timeline data, active filters and request feedback.
 */
export interface IProjectTimelineState {
  filters?: IFilterProps[]

  activeFilters?: { [key: string]: string[] }

  projects?: ProjectListModel[]

  columns?: ProjectColumn[]

  data?: ITimelineData

  filteredData?: ITimelineData

  timelineConfig?: TimelineConfigurationModel[]

  error?: Error

  loading?: boolean

  showDetails?: { item: ITimelineItem; element: HTMLElement }
}
