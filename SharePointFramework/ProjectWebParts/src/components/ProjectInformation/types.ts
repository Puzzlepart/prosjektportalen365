import { TypedHash } from '@pnp/common'
import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from '../BaseWebPartComponent'
import { ProjectColumn } from 'pp365-shared/lib/models'
import { IProgressDialogProps } from './ProgressDialog/types'
import { IUserMessageProps } from 'pp365-shared/lib/components/UserMessage'
import { IEntityField } from 'sp-entityportal-service'
import * as ProjectDataService from 'pp365-shared/lib/services/ProjectDataService'
import { ProjectPropertyModel } from './ProjectProperties/ProjectProperty'
import { ActionType } from './Actions/types'
import { Web } from '@pnp/sp'
import { IProjectStatusData } from '../ProjectStatus'

export class ProjectInformationParentProject {
  public title: string
  public url: string
  public childProjects: any[]
  public iconName: 'ProductVariant' | 'ProductList'

  constructor(spItem: TypedHash<any>, public web: Web) {
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
  showFieldExternal?: TypedHash<boolean>

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
   * All Properties
   */
  allProperties?: ProjectPropertyModel[]

  /**
   * Progress
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
  showAllPropertiesPanel?: boolean

  /**
   * Current user has edit permission (edc568a8-9cfc-4547-9af2-d9d3aeb5aa2a)
   */
  userHasEditPermission?: boolean

  /**
   * Is Project data synced
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
  fields?: IEntityField[]
}
