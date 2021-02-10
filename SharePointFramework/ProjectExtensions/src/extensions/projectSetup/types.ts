import { ITemplateSelectDialogState } from 'components/TemplateSelectDialog'
import { IHubSite } from 'sp-hubsite-service'
import { ListContentConfig, ProjectExtension, ProjectTemplate } from '../../models/index'

export interface IProjectSetupProperties {
  /**
   * Templates library
   */
  templatesLibrary: string

  /**
   * Exensions library
   */
  extensionsLibrary: string

  /**
   * Projects list
   */
  projectsList: string

  /**
   * List content config list
   */
  contentConfigList: string

  /**
   * Term set IDs
   */
  termSetIds: { [key: string]: string }

  /**
   * Tasks
   */
  tasks: string[]
}

export interface IProjectSetupData extends ITemplateSelectDialogState {
  /**
   * Templates
   */
  templates?: ProjectTemplate[]

  /**
   * Extensions
   */
  extensions?: ProjectExtension[]

  /**
   * List content config
   */
  listContentConfig?: ListContentConfig[]

  /**
   * Hub site
   */
  hub?: IHubSite
}

export enum ProjectSetupValidation {
  InvalidWebLanguage,
  NoHubConnection,
  InvalidCulture,
  Ready
}
