import { ITimelineItem, ITimelineGroup } from '../../../interfaces'
import moment from 'moment'
import { IColumn } from '@fluentui/react'
import { IFilterItemProps, IFilterProps } from '../../FilterPanel'
import { ICommandsProps } from '../Commands/types'

export type TimelineTimeframe = [
  [number, moment.unitOfTime.DurationConstructor],
  [number, moment.unitOfTime.DurationConstructor]
]

export interface ITimelineProps
  extends Pick<ICommandsProps, 'onGroupByChange' | 'isGroupByEnabled' | 'defaultGroupBy'> {
  /**
   * Timeline default timeframe
   */
  defaultTimeframe?: TimelineTimeframe

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
   *
   * @param column Column
   * @param selectedItems Selected items
   */
  onFilterChange: (column: IColumn, selectedItems: IFilterItemProps[]) => void

  /**
   * Title of the timeline
   */
  title?: string

  /**
   * Hide sidebar (defaults to `false`)
   */
  hideSidebar?: boolean

  /**
   * Information text
   */
  infoText?: string

  /**
   * Show information text above the timeline (defaults to `true`)
   */
  showInfoText?: boolean
}
