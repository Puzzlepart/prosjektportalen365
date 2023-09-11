import { ITimelineItem, ITimelineGroup } from '../../../interfaces'
import moment from 'moment'
import { IColumn } from '@fluentui/react'
import { IFilterItemProps, IFilterProps } from '../../FilterPanel'

export type TimelineTimeframe = [
  [number, moment.unitOfTime.DurationConstructor],
  [number, moment.unitOfTime.DurationConstructor]
]

export interface ITimelineProps {
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
   * On Group change
   *
   * @param groupBy Group by
   */
  onGroupByChange?: (groupBy: string) => void

  /**
   * Is group by enabled
   */
  isGroupByEnabled?: boolean

  /**
   * Default group by
   */
  defaultGroupBy?: string

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
}
