import { IBaseComponentProps } from '../types'
import * as moment from 'moment'
import { ITimelineData, ITimelineItem } from 'interfaces'
import { ProjectListModel } from 'models'

export interface IProjectTimelineProps extends IBaseComponentProps {
  /**
   * Data source
   */
  dataSource: string

  /**
   * Default time start
   */
  defaultTimeStart?: [number, moment.unitOfTime.DurationConstructor]

  /**
   * Default time end
   */
  defaultTimeEnd?: [number, moment.unitOfTime.DurationConstructor]

  /**
   * Conditional infotext
   */
  infoText?: string
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
   * Error
   */
  error?: string

  /**
   * Item to show show details for
   */
  showDetails?: { item: ITimelineItem; element: HTMLElement }
}
