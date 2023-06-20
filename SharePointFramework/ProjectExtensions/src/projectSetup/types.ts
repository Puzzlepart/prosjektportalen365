import { IDialogContentProps } from '@fluentui/react'
import { ITemplateSelectDialogState } from 'components/TemplateSelectDialog'
import { ContentConfig, ProjectExtension, ProjectTemplate } from '../models/index'

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

  /**
   * Progress dialog content props. Override properties like
   * `title` and `subText`.
   */
  progressDialogContentProps?: IDialogContentProps
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
   * Content config
   */
  contentConfig?: ContentConfig[]
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
   * The site is hubsite
   */
  IsHubSite
}
