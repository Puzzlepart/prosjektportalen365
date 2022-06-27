import { IBaseComponentProps } from '../types'
import * as moment from 'moment'
import { ITimelineData, ITimelineItem } from 'interfaces'
import { ProjectListModel } from 'models'

export interface IProjectTimelineProps extends IBaseComponentProps {
  defaultTimeStart?: [number, moment.unitOfTime.DurationConstructor]
  defaultTimeEnd?: [number, moment.unitOfTime.DurationConstructor]
  infoText?: string
  showProjectDeliveries?: boolean
  dataSourceName?: string
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
  showFilterPanel: boolean

  /**
   * Active filters
   */
  activeFilters: { [key: string]: string[] }

  /**
   * Projects
   */
  projects?: ProjectListModel[]

  /**
   * Data
   */
  data?: ITimelineData

  /**
   * Timeline Configuration
   */
  timelineConfiguration?: any

  /**
   * Error
   */
  error?: string

  /**
   * Item to show details for
   */
  showDetails?: { item: ITimelineItem; element: HTMLElement }
}
