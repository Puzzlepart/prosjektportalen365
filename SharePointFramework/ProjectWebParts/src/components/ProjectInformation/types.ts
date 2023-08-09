/* eslint-disable max-classes-per-file */
import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from 'pp365-shared-library/lib/components/BaseWebPartComponent/types'
import { IUserMessageProps } from 'pp365-shared-library/lib/components/UserMessage'
import { ProjectColumn } from 'pp365-shared-library/lib/models'
import * as ProjectDataService from 'pp365-shared-library/lib/services/ProjectDataService'
import { IProjectStatusData } from '../ProjectStatus'
import { ActionType } from './Actions/types'
import { IProgressDialogProps } from './ProgressDialog/types'
import { ProjectInformationField } from './ProjectInformationField'
import { ProjectInformationParentProject } from './ProjectInformationParentProject'

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
  properties?: ProjectInformationField[]

  /**
   * All properties (used for the properties panel)
   */
  allProperties?: ProjectInformationField[]

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

  /**
   * Properties last updated date/time
   */
  propertiesLastUpdated?: Date
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
