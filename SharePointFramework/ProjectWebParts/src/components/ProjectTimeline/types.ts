import {
  EditableSPField,
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState,
  ICustomEditPanelProps,
  IFilterProps,
  IListColumn,
  IProjectInformationData,
  ITimelineItem,
  ProjectColumn,
  TimelineConfigurationModel
} from 'pp365-shared-library'

/** Configures timeline content, grouping, filters and list editing. */
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

/** Timeline data, active filters, grouping and item-editing state. */
export interface IProjectTimelineState extends IBaseWebPartComponentState<ITimelineData> {
  groups?: ITimelineGroups

  showFilterPanel?: boolean

  filters?: IFilterProps[]

  activeFilters: Record<string, string[]>

  filteredData?: ITimelineData

  timelineConfig?: TimelineConfigurationModel[]

  showDetails?: { item: ITimelineItem; element: HTMLElement }

  selectedItems?: any[]

  /**
   * Timestamp for refetch. Changing this state variable refetches the data in
   * `useProjectTimelineDataFetch`.
   */
  refetch?: number

  panel?: Partial<ICustomEditPanelProps>

  /**
   * Timeline content type ID from template parameters
   */
  timelineContentTypeId?: string
}

/** Rendered timeline items and the source rows and fields used by its list. */
export interface ITimelineData {
  items: ITimelineItem[]

  groups: ITimelineGroup[]

  listItems?: Record<string, any>[]

  listColumns?: IListColumn[]

  fields?: EditableSPField[]

  /**
   * The current project ID in the Projects list
   */
  projectId?: number

  /**
   * Timeline content type ID from template parameters
   */
  timelineContentTypeId?: string
}

/** Supported ways to group timeline items. */
export enum TimelineGroupType {
  Project,
  Category,
  Type
}

/** Named timeline row belonging to a project, category or item type. */
export interface ITimelineGroup {
  id: number
  title: string
  type?: TimelineGroupType
}

/** Available timeline groups partitioned by grouping mode. */
export interface ITimelineGroups {
  projectGroups: ITimelineGroup[]
  categoryGroups: ITimelineGroup[]
  typeGroups: ITimelineGroup[]
}

/** Project information enriched with the project's timeline span. */
export interface IProjectTimelineData extends IProjectInformationData {
  columns?: ProjectColumn[]
}
