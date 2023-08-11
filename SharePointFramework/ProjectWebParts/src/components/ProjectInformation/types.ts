/* eslint-disable max-classes-per-file */
import { IDropdownOption } from '@fluentui/react'
import { IWeb } from '@pnp/sp/webs'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/lib/components/BaseWebPartComponent/types'
import { IUserMessageProps } from 'pp365-shared-library/lib/components/UserMessage'
import { ProjectColumn, SPField } from 'pp365-shared-library/lib/models'
import * as ProjectDataService from 'pp365-shared-library/lib/services/ProjectDataService'
import { IProjectStatusData } from '../ProjectStatus'
import { ActionType } from './Actions/types'
import { IProgressDialogProps } from './ProgressDialog/types'

/**
 * Project information field model. Used both for display
 * and edit of project information.
 */
export class ProjectInformationField {
  public id: string
  public internalName: string
  public displayName: string
  public description: string
  public type: string
  private _value: any

  /**
   * Constructs a new `ProjectInformationField` object from
   * a field from the entity and a column configuration.
   *
   * @param _field Field from the entity
   * @param column Column configuration
   */
  constructor(private _field: Record<string, any>, public column: ProjectColumn) {
    this.id = _field.Id
    this.internalName = _field.InternalName
    this.displayName = column?.name ?? _field.Title
    this.description = _field.Description
    this.type = _field.TypeAsString
  }

  /**
   * Sets the value for the field.
   *
   * @param value Value to set
   *
   * @returns the field instance
   */
  public setValue(value: any): ProjectInformationField {
    this._value = value
    return this
  }

  /**
   * Get value for the field. Optionally split by characters.
   *
   * @param splitBy Characters to split by (optional)
   */
  public getValue<T>(splitBy?: string): T {
    return splitBy ? this._value?.split(splitBy) : this._value
  }

  /**
   * Get a property for the field by property name.
   *
   * @param propertyName Property name
   */
  public getProperty(propertyName: string): string {
    return this._field[propertyName]
  }

  /**
   * Get choices for a choice field as `IDropdownOption[]`.
   */
  public get choices(): IDropdownOption[] {
    return (this._field.Choices as string[]).map((c) => ({ key: c, text: c }))
  }

  /**
   * Returns `true` if the field should be visible in edit form.
   * `ShowInEditForm` must be `true` and `Hidden` must be `false`.
   */
  public get showInEditForm(): boolean {
    return this._field.ShowInEditForm && !this._field.Hidden
  }

  /**
   * Returns `true` if the value for the field is empty.
   */
  public get isEmpty(): boolean {
    return this._value === null || this._value === undefined || this._value === ''
  }
}

/**
 * Project information parent project model. Used to display
 * parent projects in the component.
 */
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

export type ProjectInformationPanelType = 'EditPropertiesPanel' | 'AllPropertiesPanel'
export type ProjectInformationDialogType = 'CreateParentDialog' | 'SyncProjectDialog'

export interface IProjectInformationUserMessage extends IUserMessageProps {
  panel?: ProjectInformationPanelType
}

export interface IProjectInformationState
  extends IBaseWebPartComponentState<IProjectInformationData> {
  /**
   * Properties to display
   */
  properties?: ProjectInformationField[]

  /**
   * Progress dialog props
   */
  progress?: IProgressDialogProps

  /**
   * Message to show to the user
   */
  message?: IProjectInformationUserMessage

  /**
   * Confirm action props
   */
  confirmActionProps?: any

  /**
   * Is the project a parent project
   */
  isParentProject?: boolean

  /**
   * The current active panel
   */
  activePanel?: ProjectInformationPanelType

  /**
   * The current active dialog
   */
  activeDialog?: ProjectInformationDialogType

  /**
   * Current user has edit permission (edc568a8-9cfc-4547-9af2-d9d3aeb5aa2a)
   */
  userHasEditPermission?: boolean

  /**
   * Is project data synced
   */
  isProjectDataSynced?: boolean

  /**
   * Properties last updated date/time
   */
  propertiesLastUpdated?: Date
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
   * All list fields with `Gt` prefix from the project
   * properties list.
   */
  fields?: SPField[]
}
