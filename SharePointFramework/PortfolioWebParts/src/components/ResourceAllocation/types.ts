import { IShimmerProps } from '@fluentui/react'
import { ITimelineData } from 'interfaces'
import * as moment from 'moment'
import { IBaseComponentProps } from '../types'
import { IDetailsCalloutItem } from './DetailsCallout/types'

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

export interface IResourceAllocationState extends Pick<IShimmerProps, 'isDataLoaded'> {
  /**
   * Active filters
   */
  activeFilters: { [key: string]: string[] }

  /**
   * Show filter panel
   */
  showFilterPanel?: boolean

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
  showDetails?: IDetailsCalloutItem
}
