/* eslint-disable max-classes-per-file */
import { IDropdownOption } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import { IWeb } from '@pnp/sp/webs'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/lib/components/BaseWebPartComponent/types'
import { IUserMessageProps } from 'pp365-shared-library/lib/components/UserMessage'
import { ProjectColumn, SPField } from 'pp365-shared-library/lib/models'
import * as ProjectDataService from 'pp365-shared-library/lib/services/ProjectDataService'
import { IGetPropertiesData } from 'pp365-shared-library/lib/services/ProjectDataService'
import { IProjectStatusData } from '../ProjectStatus'
import { ActionType } from './Actions/types'
import { IProgressDialogProps } from './ProgressDialog/types'
import { createProjectInformationFieldValueMap } from './createProjectInformationFieldValueMap'

export type ProjectInformationFieldValue = {
  isSet?: boolean
  text: string
  $: any
}

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
  private _value: ProjectInformationFieldValue
  /**
   * Constructs a new `ProjectInformationField` instance.
   *
   * @param _field Field data
   * @param column Column data
   * @param _isExternal The current user is external with no access to portfolio level
   */
  constructor(
    private _field: Record<string, any>,
    public column: ProjectColumn,
    private _isExternal: boolean
  ) {
    this.id = _field.Id
    this.internalName = _field.InternalName
    this.displayName = column?.name ?? _field.Title
    this.description = _field.Description
    this.type = _field.TypeAsString
  }

  /**
   * Sets the value for the field. Sets the value object that consists of
   * the following properties:
   * - `isSet` - `true` if the value is set
   * - `text` - the text value for the field
   * - `$` - the value for the field
   *
   * @param propertiesData Properties data from `ProjectDataService.getProperties`
   *
   * @returns the field instance
   */
  public setValue(propertiesData: IGetPropertiesData): ProjectInformationField {
    const textValue = propertiesData.fieldValuesText[this.internalName]
    const value = propertiesData.fieldValues[this.internalName]
    this._value = {
      isSet: textValue !== undefined && textValue !== null && textValue !== '',
      text: textValue,
      $: value
    }
    return this
  }

  /**
   * Get value for the field.
   *
   * @param value Optional value to use instead of the internal value
   */
  public getValue<T>(value = this._value): T {
    const valueMap = createProjectInformationFieldValueMap<T>()
    const fieldValue = valueMap.has(this.type) ? valueMap.get(this.type)(value) : value.text
    return fieldValue as unknown as T
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
   * Returns `true` if the field should be visible in the
   * specified display mode. When checking for `DisplayMode.Read``
   * the `props.page` property is used to determine which properties to display.
   *
   * Also handles using `showFieldExternal` property to determine if
   * the field should be visible for external users with no access to
   * portfolio level.
   *
   * @param displayMode Display mode
   * @param props Props for the `ProjectInformation` component
   */
  public isVisible(displayMode: DisplayMode, props?: IProjectInformationProps): boolean {
    switch (displayMode) {
      case DisplayMode.Edit:
        return this._field.ShowInEditForm && !this._field.Hidden
      case DisplayMode.Read: {
        if (this._isExternal) return props.showFieldExternal[this.internalName]
        return this.column.isVisible(props.page)
      }
    }
  }

  /**
   * Returns `true` if the value for the field is empty.
   */
  public get isEmpty(): boolean {
    return !this._value?.isSet
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
   * Properties for the `ProgressDialog` component
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
   * The current active panel.
   *
   * Can be one of the following:
   * - `EditPropertiesPanel`
   * - `AllPropertiesPanel`
   */
  activePanel?: ProjectInformationPanelType

  /**
   * The current active dialog.
   *
   * Can be one of the following:
   * - `CreateParentDialog`
   * - `SyncProjectDialog`
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
