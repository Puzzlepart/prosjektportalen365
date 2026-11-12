import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState,
  ProjectColumn,
  EditableSPField,
  ProjectInformationParentProject,
  ProjectInformationChildProject,
  ProjectTemplate,
  IUserMessageProps
} from 'pp365-shared-library'
import * as ProjectDataService from 'pp365-shared-library/lib/services/ProjectDataService'
import { IProjectStatusData } from '../ProjectStatus'
import { ActionType } from './Actions/types'
import { IProgressDialogProps } from './ProgressDialog/types'
import { IArchiveStatusInfo } from '../../data/SPDataAdapter/types'
import type { SustainabilityGoalIconSize } from './SustainabilityGoals'

/** Panels available from the project information actions. */
export type ProjectInformationPanelType = 'EditPropertiesPanel' | 'AllPropertiesPanel'
/** Setup dialogs available from project information. */
export type ProjectInformationDialogType = 'CreateParentDialog' | 'RunProjectSetupDialog'
/** Host page determining which project information sections are available. */
export type ProjectInformationPage = 'Frontpage' | 'ProjectStatus' | 'Portfolio'

/** Configures project properties, related projects, reports and actions. */
export interface IProjectInformationProps extends IBaseWebPartComponentProps {
  /**
   * Page property is used to determine which properties to display
   */
  page: ProjectInformationPage

  /**
   * Leaves out the web part's title, for a host that shows it itself (the project information
   * panel names itself after the project in its header). The actions are still named after it.
   */
  hideTitle?: boolean

  hideAllActions?: boolean

  hideActions?: string[]

  onFieldExternalChanged?: (fieldName: string, checked: boolean) => void

  showFieldExternal?: Record<string, boolean>

  /**
   * Internal names of fields to show when hub access is unavailable.
   * If empty, legacy external configuration or current fallback behavior is used.
   */
  fallbackVisibleFields?: string[]

  adminPageLink?: string

  skipSyncToHub?: boolean

  customActions?: ActionType[]

  hideParentProjects?: boolean

  hideChildProjects?: boolean

  hideStatusReport?: boolean

  hideArchiveStatus?: boolean

  showSustainabilityGoalsAsIcons?: boolean

  sustainabilityGoalIconSize?: SustainabilityGoalIconSize

  /**
   * Truncate status report comments to the specified length and add ellipsis (...)
   */
  statusReportTruncateComments?: number

  /**
   * Show only icons for latest status report
   */
  statusReportShowOnlyIcons?: boolean

  rowLimit?: number

  minRowLimit?: number

  maxRowLimit?: number

  /**
   * Additional class name for the component (in addition to `styles.root`)
   */
  className?: string
}

/** Project information data, permissions and active operations. */
export interface IProjectInformationState extends IBaseWebPartComponentState<IProjectInformationData> {
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

  message?: IUserMessageProps

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
   * - `RunProjectSetupDialog`
   */
  activeDialog?: ProjectInformationDialogType

  /**
   * Current user has edit permission (`edc568a8-9cfc-4547-9af2-d9d3aeb5aa2a`)
   */
  userHasEditPermission?: boolean

  /**
   * Current user has rerun setup permission (`5c2fd32e-0c8b-42be-9e0b-4fa6ff5d4774`)
   */
  userHasRerunSetupPermission?: boolean

  hubIsAvailable?: boolean

  propertiesLastUpdated?: Date

  /**
   * Warning shown when saved properties were not synced to the hub, with the reason
   */
  hubSyncWarning?: string
}

/** Project properties enriched with hub configuration, reports and relationships. */
export interface IProjectInformationData
  extends
    ProjectDataService.IProjectInformationData,
    Pick<IProjectStatusData, 'reports' | 'sections' | 'columnConfig'> {
  columns?: ProjectColumn[]

  parentProjects?: ProjectInformationParentProject[]

  childProjects?: ProjectInformationChildProject[]

  /**
   * The template used for the project
   */
  template?: ProjectTemplate

  /**
   * Archive status information (only available on frontpage)
   */
  archiveStatus?: IArchiveStatusInfo
}
