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
  defaultTimeframe?: TimelineTimeframe
  groups: ITimelineGroup[]
  items: ITimelineItem[]
  filters: IFilterProps[]
  onFilterChange: (column: IColumn, selectedItems: IFilterItemProps[]) => void
  infoText?: string
  title?: string
}
