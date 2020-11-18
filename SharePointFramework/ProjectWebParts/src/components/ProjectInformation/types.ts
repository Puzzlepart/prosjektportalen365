import { TypedHash } from '@pnp/common'
import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from '../BaseWebPartComponent'
import { ActionType } from './Actions/ActionType'
import { StatusReport, ProjectColumn } from 'shared/lib/models'
import { IProgressDialogProps } from 'components/ProgressDialog/types'
import { IUserMessageProps } from 'components/UserMessage'
import { IEntityField } from 'sp-entityportal-service'
import * as ProjectDataService from 'shared/lib/services/ProjectDataService'
import { ProjectPropertyModel } from './ProjectProperties/ProjectProperty'

export interface IProjectInformationProps extends IBaseWebPartComponentProps {
  /**
   * Page
   */
  page: 'Frontpage' | 'ProjectStatus' | 'Portfolio'

  /**
   * Hide actions for the web part
   */
  hideActions?: boolean

  /**
   * Header text for status reports
   */
  statusReportsHeader?: string

  /**
   * Number of status reports to show (defaults to 0)
   */
  statusReportsCount?: number

  /**
   * On field external changed
   */
  onFieldExternalChanged?: (fieldName: string, checked: boolean) => void

  /**
   * A hash object of fields to show for external users
   */
  showFieldExternal?: TypedHash<boolean>

  /**
   * Skip sync to hub
   */
  skipSyncToHub?: boolean

  /**
   * Custom actions/button to add
   */
  customActions?: ActionType[]
}

export interface IProjectInformationState
  extends IBaseWebPartComponentState<IProjectInformationData> {
  /**
   * Properties
   */
  properties?: ProjectPropertyModel[]

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
}

export interface IProjectInformationUrlHash {
  syncproperties: string
  force: string
}

export interface IProjectInformationData extends ProjectDataService.IGetPropertiesData {
  /**
   * Array of status reports
   */
  statusReports?: StatusReport[]

  /**
   * Column configuration
   */
  columns?: ProjectColumn[]

  /**
   * Array of fields from the entity
   */
  fields?: IEntityField[]
}
