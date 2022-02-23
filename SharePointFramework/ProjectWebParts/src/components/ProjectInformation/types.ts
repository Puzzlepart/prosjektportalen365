import { TypedHash } from '@pnp/common'
import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from '../BaseWebPartComponent'
import { ProjectColumn } from 'pp365-shared/lib/models'
import { IProgressDialogProps } from 'components/ProgressDialog/types'
import { IUserMessageProps } from 'components/UserMessage'
import { IEntityField } from 'sp-entityportal-service'
import * as ProjectDataService from 'pp365-shared/lib/services/ProjectDataService'
import { ProjectPropertyModel } from './ProjectProperties/ProjectProperty'
import { ActionType } from './Actions/types'

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

  /**
   * Display parent creation modal
   */
  displayParentCreationModal?: boolean

  /**
   * Is the project a parent project
   */
  isParentProject?: boolean
}

export interface IProjectInformationUrlHash {
  syncproperties: string
  force: string
}

export interface IProjectInformationData extends ProjectDataService.IGetPropertiesData {
  /**
   * Column configuration
   */
  columns?: ProjectColumn[]

  /**
   * Array of fields from the entity
   */
  fields?: IEntityField[]
}
