import { IColumn } from '@fluentui/react'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState,
  IFilterProps,
  ITimelineItem,
  ProjectColumn,
  TimelineConfigurationModel,
  IProjectInformationData
} from 'pp365-shared-library/lib'

export interface IProjectTimelineProps extends IBaseWebPartComponentProps {
  listName?: string
  showTimeline?: boolean
  showTimelineList?: boolean
  showTimelineListCommands?: boolean
  infoText?: string
  showProjectDeliveries?: boolean
  projectDeliveriesListName?: string
  configItemTitle?: string
  defaultTimeframeStart?: string
  defaultTimeframeEnd?: string
  defaultGroupBy?: string
  defaultCategory?: string
}

export interface IProjectTimelineState extends IBaseWebPartComponentState<ITimelineData> {
  /**
   * Groups
   */
  groups?: ITimelineGroups

  /**
   * Show filter panel
   */
  showFilterPanel?: boolean

  /**
   * Filters
   */
  filters?: IFilterProps[]

  /**
   * Active filters
   */
  activeFilters: Record<string, string[]>

  /**
   * Filtered data
   */
  filteredData?: ITimelineData

  /**
   * Timeline configuration
   */
  timelineConfig?: TimelineConfigurationModel[]

  /**
   * Item to show details for
   */
  showDetails?: { item: ITimelineItem; element: HTMLElement }

  /**
   * Timestamp for refetch. Changing this state variable refetches the data in
   * `useProjectTimelineDataFetch`.
   */
  refetch?: number
}

export interface ITimelineData {
  items: ITimelineItem[]
  groups: ITimelineGroup[]
  listItems?: Record<string, any>[]
  listColumns?: IColumn[]
}

export enum TimelineGroupType {
  Project,
  Category,
  Type
}

export interface ITimelineGroup {
  id: number
  title: string
  type?: TimelineGroupType
}

export interface ITimelineGroups {
  projectGroups: ITimelineGroup[]
  categoryGroups: ITimelineGroup[]
  typeGroups: ITimelineGroup[]
}

export interface IProjectTimelineData extends IProjectInformationData {
  /**
   * Column configuration
   */
  columns?: ProjectColumn[]
}
