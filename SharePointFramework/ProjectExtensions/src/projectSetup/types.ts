import { ITemplateSelectDialogState } from 'components/TemplateSelectDialog'
import { IHubSite } from 'sp-hubsite-service'
import { ListContentConfig, ProjectExtension, ProjectTemplate } from '../models/index'

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

  /**
   * Skip reload after setup
   */
  skipReload?: boolean

  /**
   * Force template to be selected and
   * auto-run the provisioning.
   */
  forceTemplate?: string
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
  /**
   * The site has invalid web language
   */
  InvalidWebLanguage,

  /**
   * The site is not connected to a hub
   */
  NoHubConnection,

  /**
   * The site has invalid UI culture settings
   */
  InvalidCulture,

  /**
   * The site is ready for setup/configuration
   */
  Ready,

  /**
   * The site is already finished setup
   */
  AlreadySetup,

  /**
   * Skip template selection
   */
  SkipTemplateSelection
}
