/* eslint-disable max-classes-per-file */
import {
  IUserMessageProps,
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState,
  ProjectColumn,
  ProjectInformationField,
  ProjectInformationParentProject,
  SPField,
  IProjectInformationData
} from 'pp365-shared-library/lib'
import { IProjectStatusData } from '../ProjectStatus'
import { ActionType } from './Actions/types'
import { IProgressDialogProps } from './ProgressDialog/types'

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
  extends IProjectInformationData,
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
