import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from '../BaseWebPartComponent/types'
import { TypedHash } from '@pnp/common'
import * as ProjectDataService from 'pp365-shared/lib/services/ProjectDataService'
import * as moment from 'moment'
import { ProjectColumn } from 'pp365-shared/lib/models'
import { IEntityField } from 'sp-entityportal-service'
import { stringIsNullOrEmpty } from '@pnp/common'
import { IFilterProps } from 'pp365-portfoliowebparts/lib/components/FilterPanel'
import { Web } from '@pnp/sp'

export interface IProjectTimelineProps extends IBaseWebPartComponentProps {
  web?: Web
  listName?: string
  showFilterButton?: boolean
  showTimeline?: boolean
  showTimelineList?: boolean
  showCmdTimelineList?: boolean
  infoText?: string
  showProjectDeliveries?: boolean
  projectDeliveriesListName?: string
  configItemTitle?: string
}

export interface IProjectTimelineState extends IBaseWebPartComponentState<IProjectTimelineData> {
  /**
   * Whether the component is loading
   */
  loading: boolean

  /**
   * Groups
   */
  groups?: ITimelineGroups

  /**
   * Properties
   */
  properties?: ProjectPropertyModel[]

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
   * Data
   */
  data?: any

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
  projectGroup: ITimelineGroup[]
  categoryGroup: ITimelineGroup[]
  typeGroup: ITimelineGroup[]
}

export interface IItemData {
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
  data?: IItemData
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

export class ProjectPropertyModel {
  /**
   * Internal name of the field
   */
  public internalName: string

  /**
   * Display name of the field
   */
  public displayName: string

  /**
   * Description of the field
   */
  public description: string

  /**
   * Value for the field
   */
  public value?: string

  /**
   * Type of the field
   */
  public type?: string

  /**
   * Creates an instance of ProjectPropertyModel
   *
   * @param field Field
   * @param value Value
   */
  constructor(field: IEntityField, value: string) {
    this.internalName = field.InternalName
    this.displayName = field.Title
    this.description = field.Description
    this.value = value
    this.type = field.TypeAsString
  }

  public get empty() {
    return stringIsNullOrEmpty(this.value)
  }
}
