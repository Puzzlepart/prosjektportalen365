import { TypedHash } from '@pnp/common'
import * as moment from 'moment'
import { IFilterProps } from 'pp365-portfoliowebparts/lib/components/FilterPanel'
import { ProjectColumn } from 'pp365-shared/lib/models'
import * as ProjectDataService from 'pp365-shared/lib/services/ProjectDataService'
import { IEntityField } from 'sp-entityportal-service'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from '../BaseWebPartComponent/types'

export interface IProjectTimelineProps extends IBaseWebPartComponentProps {
  listName?: string
  showFilterButton?: boolean
  showTimeline?: boolean
  showTimelineList?: boolean
  showCmdTimelineList?: boolean
  infoText?: string
  showProjectDeliveries?: boolean
  projectDeliveriesListName?: string
  configItemTitle?: string
  defaultVisibleStart?: string
  defaultVisibleEnd?: string
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
  activeFilters: { [key: string]: string[] }

  /**
   * Filtered data
   */
  filteredData?: ITimelineData

  /**
   * Timeline Configuration
   */
  timelineConfiguration?: any

  /**
   * Error
   */
  error?: Error

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
  timelineListItems?: any[]
  timelineColumns?: any[]
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

export interface ITimelineItemData {
  phase?: string
  description?: string
  milestoneDate?: moment.Moment
  type?: string
  budgetTotal?: string
  costsTotal?: string
  sortOrder?: number
  hexColor?: string
  category?: string
  elementType?: string
  filter?: boolean
  tag?: string
}

export interface ITimelineItem {
  id: number
  title: string
  group: number
  start_time: moment.Moment
  end_time: moment.Moment
  allocation?: number
  itemProps: React.HTMLProps<HTMLDivElement>
  project: string
  projectUrl?: string
  data?: ITimelineItemData
  role?: string
  resource?: string
  props: TypedHash<any>
}

export interface IProjectTimelineData extends ProjectDataService.IGetPropertiesData {
  /**
   * Column configuration
   */
  columns?: ProjectColumn[]

  /**
   * Array of fields from the entity
   */
  fields?: IEntityField[]
}
