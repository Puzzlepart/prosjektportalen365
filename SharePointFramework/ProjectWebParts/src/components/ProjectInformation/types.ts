/* eslint-disable max-classes-per-file */
import { IWeb } from '@pnp/sp/webs'
import { IUserMessageProps } from 'pp365-shared-library/lib/components/UserMessage'
import { ProjectColumn } from 'pp365-shared-library/lib/models'
import * as ProjectDataService from 'pp365-shared-library/lib/services/ProjectDataService'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/src/components/BaseWebPartComponent'
import { IProjectStatusData } from '../ProjectStatus'
import { ActionType } from './Actions/types'
import { IProgressDialogProps } from './ProgressDialog/types'
import { ProjectPropertyModel } from './ProjectProperties/ProjectProperty'

export class ProjectInformationParentProject {
  public title: string
  public url: string
  public childProjects: any[]
  public iconName: 'ProductVariant' | 'ProductList'

  constructor(spItem: Record<string, any>, public web: IWeb) {
    this.title = spItem.Title
    this.url = spItem.GtSiteUrl
    this.childProjects = (JSON.parse(spItem.GtChildProjects ?? []) as any[]).map((i) => i.SPWebURL)
    if (spItem.GtIsParentProject) this.iconName = 'ProductVariant'
    else if (spItem.GtIsProgram) this.iconName = 'ProductList'
  }
}

export class ProjectInformationField {
  id: string
  internalName: string
  title: string
  description: string
  type: string
  schemaXml: string
  textField: string
  choices: string[]

  /**
   * Constructs a new `ProjectInformationField` object from
   * a field from the entity and a column configuration.
   * 
   * @param _field Field from the entity
   * @param _column Column configuration
   */
  constructor(private _field: Record<string, any>, private _column: ProjectColumn) {
    this.id = this._field.Id
    this.internalName = this._field.InternalName
    this.title = this._column.name ?? _field.Title
    this.description = this._field.Description
    this.type = this._field.TypeAsString
    this.schemaXml = this._field.SchemaXml
    this.textField = this._field.TextField
    this.choices = this._field.Choices
  }

  public get showInEditForm(): boolean {
    return this._field.ShowInEditForm && !this._field.Hidden
  }
}

export interface IProjectInformationProps extends IBaseWebPartComponentProps {
  /**
   * Page property is used to determine which properties to display
   */
  page: 'Frontpage' | 'ProjectStatus' | 'Portfolio'

  /**
   * Hide all actions for the web part
   */
  hideAllActions?: boolean

  /**
   * Hide specific actions for the web part
   */
  hideActions?: string[]

  /**
   * Use frameless buttons (`ActionButton`)
   */
  useFramelessButtons?: boolean

  /**
   * On field external changed
   */
  onFieldExternalChanged?: (fieldName: string, checked: boolean) => void

  /**
   * A hash object of fields to show for external users
   */
  showFieldExternal?: Record<string, boolean>

  /**
   * Link to the admin page
   */
  adminPageLink?: string

  /**
   * Skip sync to hub
   */
  skipSyncToHub?: boolean

  /**
   * Custom actions/button to add
   */
  customActions?: ActionType[]

  /**
   * Use idea processing for syncronization of project properties.
   * Will show button to sync project properties if turned on.
   */
  useIdeaProcessing?: boolean

  /**
   * Which configuration to use for idea processing syncronization
   */
  ideaConfiguration?: string

  /**
   * Hide parent projects section
   */
  hideParentProjects?: boolean

  /**
   * Hide latest status report
   */
  hideStatusReport?: boolean

  /**
   * Truncate status report comments to the specified length and add ellipsis (...)
   */
  statusReportTruncateComments?: number

  /**
   * Show only icons for latest status report
   */
  statusReportShowOnlyIcons?: boolean
}

export interface IProjectInformationState
  extends IBaseWebPartComponentState<IProjectInformationData> {
  /**
   * Properties
   */
  properties?: ProjectPropertyModel[]

  /**
   * All properties (used for the properties panel)
   */
  allProperties?: ProjectPropertyModel[]

  /**
   * Progress dialog props
   */
  progress?: IProgressDialogProps

  /**
   * Message to show to the user
   */
  message?: IUserMessageProps

  /**
   * Confirm action props
   */
  confirmActionProps?: any

  /**
   * Is the project a parent project
   */
  isParentProject?: boolean

  /**
   *  Display `<CreateParentDialog />`
   */
  displayCreateParentDialog?: boolean

  /**
   * Display `<SyncProjectDialog />`
   */
  displaySyncProjectDialog?: boolean

  /**
   * Show project properties panel
   */
  displayAllPropertiesPanel?: boolean

  /**
   * Show edit properties panel
   */
  displayEditPropertiesPanel?: boolean

  /**
   * Current user has edit permission (edc568a8-9cfc-4547-9af2-d9d3aeb5aa2a)
   */
  userHasEditPermission?: boolean

  /**
   * Is project data synced
   */
  isProjectDataSynced?: boolean
}

export interface IProjectInformationUrlHash {
  syncproperties: string
  force: string
}

export interface IProjectInformationData
  extends ProjectDataService.IGetPropertiesData,
  Pick<IProjectStatusData, 'reports' | 'sections' | 'columnConfig'> {
  /**
   * Column configuration
   */
  columns?: ProjectColumn[]

  /**
   * Parent projects
   */
  parentProjects?: ProjectInformationParentProject[]

  /**
   * Array of fields from the entity
   */
  fields?: any[]
}
