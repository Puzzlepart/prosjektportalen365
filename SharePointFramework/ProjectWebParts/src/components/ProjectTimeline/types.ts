import { IColumn } from '@fluentui/react'
import {
  EditableSPField,
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState,
  ICustomEditPanelProps,
  IFilterProps,
  IProjectInformationData,
  ITimelineItem,
  ProjectColumn,
  TimelineConfigurationModel
} from 'pp365-shared-library'

export interface IProjectTimelineProps extends IBaseWebPartComponentProps {
  listName?: string
  showTimeline?: boolean
  showTimelineList?: boolean
  showTimelineListCommands?: boolean
  infoText?: string
  showProjectDeliveries?: boolean
  projectDeliveriesListName?: string
  configItemTitle?: string
  projectTimeLapse?: boolean
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
   * Selected items
   */
  selectedItems?: any[]

  /**
   * Timestamp for refetch. Changing this state variable refetches the data in
   * `useProjectTimelineDataFetch`.
   */
  refetch?: number

  /**
   * Panel for editing or creating new timeline content
   */
  panel?: Partial<ICustomEditPanelProps>
}

export interface ITimelineData {
  /**
   * Items for timeline content
   */
  items: ITimelineItem[]

  /**
   * Groups for timeline content
   */
  groups: ITimelineGroup[]

  /**
   * List items for timeline content
   */
  listItems?: Record<string, any>[]

  /**
   * Columns for timeline content
   */
  listColumns?: IColumn[]

  /**
   * Editable fields for timeline content
   */
  fields?: EditableSPField[]

  /**
   * The current project ID in the Projects list
   */
  projectId?: number
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
