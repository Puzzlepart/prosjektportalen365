// IListEnsureResult still exists in PnPjs 4 but is no longer re-exported from the lists barrel.
import { IListEnsureResult } from '@pnp/sp/lists/types'
import { SPField } from '../../models'
import { SPFxContext } from '../../types'
import strings from 'SharedLibraryStrings'
import { ErrorWithIntent } from '../../interfaces'
import { LogLevel } from '@pnp/logging'
import resource from 'SharedResources'

import { format } from '../../util'
/**
 * Identifies a provisioned hub list used by the portal data service.
 */
export type PortalDataServiceList =
  | 'PROJECTS'
  | 'STATUS_SECTIONS'
  | 'PROJECT_COLUMNS'
  | 'PROJECT_COLUMN_CONFIGURATION'
  | 'PROJECT_STATUS'
  | 'PORTFOLIO_VIEWS'
  | 'PROJECT_CONTENT_COLUMNS'
  | 'DATA_SOURCES'
  | 'PROJECT_STATUS_ATTACHMENTS'
  | 'PROJECT_ADMIN_ROLES'
  | 'PROJECT_TEMPLATE_CONFIGURATION'
  | 'PROJECT_DATA'
  | 'IDEA_PROCESSING'
  | 'GLOBAL_SETTINGS'
  | 'TIMELINE_CONTENT'
  | 'INSTALLATION_LOG'

/**
 * Configures the hub client, localized list names and logging.
 */
export interface IPortalDataServiceConfiguration extends Object {
  spfxContext?: SPFxContext

  /**
   * Override the URL from the `spfxContext` to use a different URL.
   */
  url?: string

  /**
   * The list names for the different lists used by the data service.
   *
   * @remarks
   * Use list names from the `SharedResources` module.
   *
   * @example
   * ```typescript
   * import resource from 'SharedResources'
   *
   * const config: IPortalDataServiceConfiguration = {
   *   listNames: {
   *     PROJECTS: resource.Lists_Projects_Title
   *   }
   * }
   * ```
   *
   * That way, the list names are automatically localized and you'll
   * get intellisense for the list names for the different languages.
   */
  listNames?: {
    STATUS_SECTIONS?: string

    PROJECT_COLUMNS?: string

    PROJECT_COLUMN_CONFIGURATION?: string

    PROJECTS?: string

    PROJECT_STATUS?: string

    PROJECT_STATUS_ATTACHMENTS?: string

    PORTFOLIO_VIEWS?: string

    PROJECT_CONTENT_COLUMNS?: string

    DATA_SOURCES?: string

    PROJECT_ADMIN_ROLES?: string

    PROJECT_TEMPLATE_CONFIGURATION?: string

    PROJECT_DATA?: string

    IDEA_PROCESSING?: string

    GLOBAL_SETTINGS?: string

    TIMELINE_CONTENT?: string

    /**
     * The name of the list for the installation log.
     */
    INSTALLATION_LOG?: string
  }

  templateParametersFieldXml?: string

  activeLogLevel?: LogLevel
}

/**
 * Uses provisioned hub list names, template-field XML and disabled logging by default.
 */
export const PortalDataServiceDefaultConfiguration: Partial<IPortalDataServiceConfiguration> = {
  listNames: {
    STATUS_SECTIONS: resource.Lists_StatusSections_Title,
    PROJECT_COLUMNS: resource.Lists_ProjectColumns_Title,
    PROJECT_COLUMN_CONFIGURATION: resource.Lists_ProjectColumnConfiguration_Title,
    PROJECT_STATUS: resource.Lists_ProjectStatus_Title,
    PROJECT_STATUS_ATTACHMENTS: resource.Lists_ProjectStatusAttachments_Title,
    PROJECTS: resource.Lists_Projects_Title,
    PORTFOLIO_VIEWS: resource.Lists_PortfolioViews_Title,
    PROJECT_CONTENT_COLUMNS: resource.Lists_ProjectContentColumns_Title,
    DATA_SOURCES: resource.Lists_DataSources_Title,
    PROJECT_ADMIN_ROLES: resource.Lists_ProjectAdminRoles_Title,
    PROJECT_TEMPLATE_CONFIGURATION: resource.Lists_TemplateOptions_Title,
    PROJECT_DATA: resource.Lists_ProjectData_Title,
    IDEA_PROCESSING: resource.Lists_IdeaProcessing_Title,
    GLOBAL_SETTINGS: resource.Lists_Global_Settings_Title,
    TIMELINE_CONTENT: resource.Lists_TimelineContent_Title,
    INSTALLATION_LOG: resource.Lists_InstallationLog_Title
  },
  templateParametersFieldXml:
    '<Field Type="Note" DisplayName="TemplateParameters" ID="{b8854944-7141-471f-b8df-53d93a4395ba}" StaticName="TemplateParameters" Name="TemplateParameters" UnlimitedLengthInDocumentLibrary="TRUE" Hidden="TRUE" />',
  activeLogLevel: LogLevel.Off
}

/**
 * Controls status-report filtering, selected fields, paging and caching.
 */
export type GetStatusReportsOptions = {
  filter?: string
  top?: number
  select?: string[]
  useCaching?: boolean

  /**
   * Internal names of `User`/`UserMulti` fields to select and expand
   * (`Id`, `Title`, `EMail`) — needed to prefill people pickers and render
   * person values from the report items.
   */
  userFields?: string[]
}

/**
 * Configures a destination list's content-type and field synchronization.
 */
export type SyncListParams = {
  url: string

  listName: string

  contentTypeId: string

  properties?: Record<string, string>

  /**
   * Progress function to call during the sync process.
   */
  progressFunc?: (progress: string) => void
}

/**
 * Returns the ensured list and the fields added during synchronization.
 */
export interface ISyncListReturnType extends IListEnsureResult {
  fieldsAdded: SPField[]
}

/**
 * Summarizes a project's identity and parent or program status.
 */
export interface IProjectDetails {
  id: number

  title: string

  /**
   * Is this project a parent project? Property `GtIsParentProject`
   * or `GtIsProgram` is set to `true` on the project item.
   */
  isParentProject: boolean
}

/**
 * Where the current site keeps its project data:
 * - `none`: on the hub, as before (also every site that is not a project).
 * - `shielded`: on the project site. The project has the extension «Skjerming», which adds the
 *   project data lists to the site.
 * - `unresolved`: unknown, because the check failed. Project data is neither read nor written.
 */
export type ShieldedProjectState = 'none' | 'shielded' | 'unresolved'

/**
 * Hub lists whose project data a shielded project keeps on its own site, in lists with the same
 * titles.
 */
export const SHIELDED_PROJECT_DATA_LISTS: PortalDataServiceList[] = [
  'PROJECT_STATUS',
  'PROJECT_STATUS_ATTACHMENTS'
]

/**
 * Hub lists a shielded project never writes to: they hold data about every project, and a
 * shielded project has no entity in the hub.
 */
export const SHIELDED_PROJECT_HUB_ONLY_LISTS: PortalDataServiceList[] = [
  'PROJECTS',
  'TIMELINE_CONTENT'
]

/**
 * Generates an error for when it could not be determined whether the project is shielded.
 */
export const ShieldedProjectUnresolvedError = (): ErrorWithIntent =>
  new ErrorWithIntent(
    strings.ShieldedProjectUnresolvedErrorText,
    'warning',
    strings.ShieldedProjectUnresolvedErrorTitle
  )

/**
 * Generates an error for when a shielded project would write to a hub list with project data.
 *
 * @param listName Title of the hub list
 */
export const ShieldedProjectHubListError = (listName: string): Error =>
  new Error(format(strings.ShieldedProjectHubListErrorText, listName))

/**
 * Generates an error for when the user does not have access to the portfolio.
 */
export const NoAccessToPortfolioError = (url: string): ErrorWithIntent => {
  const error = new ErrorWithIntent(
    format(strings.NoAccessToPortfolioErrorText, url),
    'warning',
    strings.NoAccessToPortfolioErrorTitle
  )
  return error
}
