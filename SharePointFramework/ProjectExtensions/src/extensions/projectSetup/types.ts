import { IProjectSetupDialogState } from 'components/ProjectSetupDialog'
import {
  ProjectTemplate,
  ProjectExtension,
  ContentConfig,
  ItemFieldValues
} from 'pp365-shared-library'

/** Extension settings controlling project setup and reruns. */
export interface IProjectSetupProperties {
  /**
   * @deprecated Use the localized library name from SharedResources.
   */
  templatesLibrary: string

  /**
   * @deprecated Use SharedResources.Lists_ProjectExtensions_Title.
   */
  extensionsLibrary: string

  /**
   * @deprecated Use SharedResources.Lists_Projects_Title.
   */
  projectsList: string

  /**
   * @deprecated Use SharedResources.Lists_ListContent_Title.
   */
  contentConfigList: string

  termSetIds: { [key: string]: string }

  /** Task-name allowlist; PreTask always runs. */
  tasks: string[]

  skipReload?: boolean

  /**
   * Force template to be selected and
   * auto-run the provisioning.
   */
  forceTemplate?: string

  progressDialogTitle?: string

  progressDialogSubText?: string

  /** Leaves stored local TemplateParameters unchanged when synchronizing properties. */
  skipUpdateTemplateParameters?: boolean

  /**
   * Bypasses confirmation before running setup on a previously configured site.
   */
  skipAlreadySetupCheck?: boolean
}

/** Available setup models, prior provisioning state and hub-write capability. */
export interface IProjectSetupData extends IProjectSetupDialogState {
  templates?: ProjectTemplate[]

  extensions?: ProjectExtension[]

  contentConfig?: ContentConfig[]

  projectData?: ItemFieldValues

  /**
   * Whether the project already has a template applied
   * (i.e. `GtProjectTemplate` has a value in the local project properties list).
   */
  hasExistingTemplate?: boolean

  /**
   * Comma-separated GtProjectListContent titles used to avoid automatically re-adding hub rows.
   */
  addedListContent?: string

  /**
   * Whether the current user can add items to the project list on the hub. When `false`,
   * the setup writes nothing to the hub and the project is not registered in the portfolio.
   * `undefined` when the check could not be made, in which case the setup writes as usual.
   *
   * `SetupProjectInformation` sets it to `false` if the hub rejects the project entry with
   * 403 although the check passed, so the remaining tasks skip their hub writes too.
   */
  hasHubWriteAccess?: boolean
}

/** Eligibility and warning states detected before project setup starts. */
export enum ProjectSetupValidation {
  InvalidWebLanguage,

  NoHubConnection,

  InvalidCulture,

  Ready,

  AlreadySetup,

  IsHubSite,

  NoGroupId,

  NotSiteAdmin,

  /**
   * Group membership is required to provision Planner resources.
   */
  UserNotGroupMember,

  /**
   * Teams channel sites inherit the site design but are not projects; remove setup silently.
   */
  IsTeamChannel
}
