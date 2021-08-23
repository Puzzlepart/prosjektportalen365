import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from '../BaseWebPartComponent/types'
import { TypedHash } from '@pnp/common'
import * as ProjectDataService from 'pp365-shared/lib/services/ProjectDataService'
import * as moment from 'moment'
import { ProjectColumn } from 'pp365-shared/lib/models'
import { IEntityField } from 'sp-entityportal-service'
import { stringIsNullOrEmpty } from '@pnp/common'

export interface IProjectTimelineProps extends IBaseWebPartComponentProps {
  /**
   * Data source
   */
  dataSource: string

  /**
   * Default time start
   */
  defaultTimeStart?: [number, moment.unitOfTime.DurationConstructor]

  /**
   * Default time end
   */
  defaultTimeEnd?: [number, moment.unitOfTime.DurationConstructor]

  /**
   * A hash object of fields to show for external users
   */
  showFieldExternal?: TypedHash<boolean>

  /**
   * Skip sync to hub
   */
  skipSyncToHub?: boolean
}

export interface IProjectTimelineState
  extends IBaseWebPartComponentState<IProjectTimelineData> {
  /**
   * Properties
   */
  properties?: ProjectPropertyModel[]

  /**
   * Selection
   */
  selectedItems?: any[]

  /**
   * Show filter panel
   */
  showFilterPanel: boolean

  /**
   * Active filters
   */
  activeFilters: { [key: string]: string[] }

  /**
   * Data
   */
  data?: any

  /**
   * Error
   */
  error?: string

  /**
   * Item to show show details for
   */
  showDetails?: { data: ITimelineItem; element: HTMLElement }
}

export interface ITimelineData {
  items: ITimelineItem[]
  groups: ITimelineGroup[],
  timelineListItems?: any,
  timelineColumns?: any;
}

export interface ITimelineGroup {
  id: number
  title: string
  type: string
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
  phase?: string
  milestoneDate?: moment.Moment
  type?: string
  budgetTotal?: string
  costsTotal?: string
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
   * @param {IEntityField} field Field
   * @param {string} value Value
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