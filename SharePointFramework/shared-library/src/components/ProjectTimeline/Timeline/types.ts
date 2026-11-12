import { ITimelineItem, ITimelineGroup } from '../../../interfaces'
import moment from 'moment'
import { IFilterItemProps, IFilterProps } from '../../FilterPanel'
import { IListColumn } from '../../../types'

/**
 * Defines the relative start and end offsets of the initial timeline window.
 */
export type TimelineTimeframe = [
  [number, moment.unitOfTime.DurationConstructor],
  [number, moment.unitOfTime.DurationConstructor]
]

/**
 * Configures timeline data, its initial window and filtering controls.
 */
export interface ITimelineProps {
  defaultTimeframe?: TimelineTimeframe

  /**
   * Timeline marker for Project time lapse
   */
  timeLapseMarker?: Date

  /**
   * Timeline groups. Array of interface `ITimelineGroup`
   */
  groups: ITimelineGroup[]

  /**
   * Timeline items. Array of interface `ITimelineItem`
   */
  items: ITimelineItem[]

  /**
   * Timeline filters. Array of interface `IFilterProps`
   */
  filters: IFilterProps[]

  /**
   * Callback function for when the filter changes.
   */
  onFilterChange: (column: IListColumn, selectedItems: IFilterItemProps[]) => void

  /**
   * On Group change
   */
  onGroupByChange?: (groupBy: string) => void

  isGroupByEnabled?: boolean

  defaultGroupBy?: string

  title?: string

  /**
   * Hide sidebar (defaults to `false`)
   */
  hideSidebar?: boolean

  infoText?: string
}
