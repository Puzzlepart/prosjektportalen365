/* eslint-disable max-classes-per-file */
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState,
  ProjectColumn,
  EditableSPField,
  ProjectInformationParentProject,
  ProjectTemplate,
  IUserMessageProps
} from 'pp365-shared-library'
import * as ProjectDataService from 'pp365-shared-library/lib/services/ProjectDataService'
import { IProjectStatusData } from '../ProjectStatus'
import { ActionType } from './Actions/types'
import { IProgressDialogProps } from './ProgressDialog/types'
import { IArchiveStatusInfo } from '../../data/SPDataAdapter/types'

export type ProjectInformationPanelType = 'EditPropertiesPanel' | 'AllPropertiesPanel'
export type ProjectInformationDialogType = 'CreateParentDialog'
export type ProjectInformationPage = 'Frontpage' | 'ProjectStatus' | 'Portfolio'

export interface IProjectInformationProps extends IBaseWebPartComponentProps {
  /**
   * Page property is used to determine which properties to display
   */
  page: ProjectInformationPage

  /**
   * Hide all actions for the web part
   */
  hideAllActions?: boolean

  /**
   * Hide specific actions for the web part
   */
  hideActions?: string[]

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
   * Hide parent projects section
   */
  hideParentProjects?: boolean

  /**
   * Hide latest status report
   */
  hideStatusReport?: boolean

  /**
   * Hide archive status section
   */
  hideArchiveStatus?: boolean

  /**
   * Truncate status report comments to the specified length and add ellipsis (...)
   */
  statusReportTruncateComments?: number

  /**
   * Show only icons for latest status report
   */
  statusReportShowOnlyIcons?: boolean

  /**
   * Additional class name for the component (in addition to `styles.root`)
   */
  className?: string
}

export interface IProjectInformationState
  extends IBaseWebPartComponentState<IProjectInformationData> {
  /**
   * Properties to display sorted by `column.sortOrder`. The properties
   * must be sent through a visibility check to determine if they should
   * be displayed or not. All properties will be displayed in the
   * `AllPropertiesPanel`.
   */
  properties?: EditableSPField[]

  /**
   * Properties for the `ProgressDialog` component
   */
  progressDialog?: IProgressDialogProps

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
   */
  activeDialog?: ProjectInformationDialogType

  /**
   * Current user has edit permission (`edc568a8-9cfc-4547-9af2-d9d3aeb5aa2a`)
   */
  userHasEditPermission?: boolean

  /**
   * Properties last updated date/time
   */
  propertiesLastUpdated?: Date
}

export interface IProjectInformationData
  extends ProjectDataService.IProjectInformationData,
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
   * The template used for the project
   */
  template?: ProjectTemplate

  /**
   * Archive status information (only available on frontpage)
   */
  archiveStatus?: IArchiveStatusInfo
}
