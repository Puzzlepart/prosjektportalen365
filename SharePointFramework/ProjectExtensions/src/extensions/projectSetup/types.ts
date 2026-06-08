import { IProjectSetupDialogState } from 'components/ProjectSetupDialog'
import {
  ProjectTemplate,
  ProjectExtension,
  ContentConfig,
  ItemFieldValues
} from 'pp365-shared-library'

export interface IProjectSetupProperties {
  /**
   * Templates library. Use value from
   * the converted .resx file instead of
   * the hardcoded string.
   *
   * @deprecated
   */
  templatesLibrary: string

  /**
   * Exensions library. Use value from
   * the converted .resx file instead of
   * the hardcoded string.
   *
   * @deprecated
   */
  extensionsLibrary: string

  /**
   * Projects list. Use value from
   * the converted .resx file instead of
   * the hardcoded string.
   *
   * @deprecated
   */
  projectsList: string

  /**
   * List content config list. Use value from
   * the converted .resx file instead of
   * the hardcoded string.
   *
   * @deprecated
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
   * Progress dialog title override.
   */
  progressDialogTitle?: string

  /**
   * Progress dialog subtitle override.
   */
  progressDialogSubText?: string

  /**
   * Skip updating template parameters fields on the project list item.
   */
  skipUpdateTemplateParameters?: boolean

  /**
   * Skip the 'already setup' check when re-running the setup wizard.
   * When `true`, the setup will go directly to the project setup dialog
   * instead of showing the error dialog asking the user to confirm.
   */
  skipAlreadySetupCheck?: boolean
}

export interface IProjectSetupData extends IProjectSetupDialogState {
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

  /**
   * Custom actions for the web
   */
  customActions?: any[]

  /**
   * Project data field values
   */
  projectData?: ItemFieldValues

  /**
   * Whether the project already has a template applied
   * (i.e. `GtProjectTemplate` has a value in the local project properties list).
   */
  hasExistingTemplate?: boolean
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
  IsHubSite,

  /**
   * The site is not connected to a group
   */
  NoGroupId,

  /**
   * The current user is not site admin
   */
  NotSiteAdmin,

  /**
   * The current user is not a member of the Microsoft
   * 365 group. This will cause issues
   * provisioning Planner resources.
   */
  UserNotGroupMember,

  /**
   * The site is a Teams private/shared channel site (web template
   * `TEAMCHANNEL`). Channel sites are hub-associated and inherit the project
   * site design, but are not projects and have no M365 group. The wizard is
   * removed silently without touching the site or involving the user.
   */
  IsTeamChannel
}
