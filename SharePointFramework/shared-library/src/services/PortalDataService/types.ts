import { IListEnsureResult } from '@pnp/sp/lists'
import { SPField } from '../../models'
import { SPFxContext } from '../../types'
import strings from 'SharedLibraryStrings'
import { format } from '@fluentui/react'
import { ErrorWithIntent } from '../../interfaces'
import { LogLevel } from '@pnp/logging'
import resource from 'SharedResources'

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

export interface IPortalDataServiceConfiguration extends Object {
  /**
   * The SPFx context to use for the data service.
   */
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
    /**
     * The name of the list for status sections.
     */
    STATUS_SECTIONS?: string

    /**
     * The name of the list for project columns.
     */
    PROJECT_COLUMNS?: string

    /**
     * The name of the list for project column configuration.
     */
    PROJECT_COLUMN_CONFIGURATION?: string

    /**
     * The name of the list for projects.
     */
    PROJECTS?: string

    /**
     * The name of the list for project status.
     */
    PROJECT_STATUS?: string

    /**
     * The name of the list for project status attachments.
     */
    PROJECT_STATUS_ATTACHMENTS?: string

    /**
     * The name of the list for portfolio views.
     */
    PORTFOLIO_VIEWS?: string

    /**
     * The name of the list for project content columns.
     */
    PROJECT_CONTENT_COLUMNS?: string

    /**
     * The name of the list for data sources.
     */
    DATA_SOURCES?: string

    /**
     * The name of the list for project admin roles.
     */
    PROJECT_ADMIN_ROLES?: string

    /**
     * The name of the list for project template configuration.
     */
    PROJECT_TEMPLATE_CONFIGURATION?: string

    /**
     * The name of the list for project data.
     */
    PROJECT_DATA?: string

    /**
     * The name of the list for idea processing.
     */
    IDEA_PROCESSING?: string

    /**
     * The name of the list for global settings.
     */
    GLOBAL_SETTINGS?: string

    /**
     * The name of the list for timeline content.
     */
    TIMELINE_CONTENT?: string
  }

  /**
   * The XML for the template parameters field.
   */
  templateParametersFieldXml?: string

  /**
   * The active log level for the data service.
   */
  activeLogLevel?: LogLevel
}

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
    PROJECT_TEMPLATE_CONFIGURATION: resource.Lists_ProjectTemplates_Title,
    PROJECT_DATA: resource.Lists_ProjectData_Title,
    IDEA_PROCESSING: resource.Lists_IdeaProcessing_Title,
    GLOBAL_SETTINGS: resource.Lists_Global_Settings_Title,
    TIMELINE_CONTENT: resource.Lists_TimelineContent_Title
  },
  templateParametersFieldXml:
    '<Field Type="Note" DisplayName="TemplateParameters" ID="{b8854944-7141-471f-b8df-53d93a4395ba}" StaticName="TemplateParameters" Name="TemplateParameters" UnlimitedLengthInDocumentLibrary="TRUE" Hidden="TRUE" />',
  activeLogLevel: LogLevel.Off
}

export type GetStatusReportsOptions = {
  filter?: string
  top?: number
  select?: string[]
  useCaching?: boolean
}

export type SyncListParams = {
  /**
   * The URL of the SharePoint site.
   */
  url: string

  /**
   * The name of the list to sync.
   */
  listName: string

  /**
   * The content type ID to use for the list.
   */
  contentTypeId: string

  /**
   * The properties to set on the list item.
   */
  properties?: Record<string, string>

  /**
   * Progress function to call during the sync process.
   * 
   * @param progress The progress text to display.
   */
  progressFunc?: (progress: string) => void
}

export interface ISyncListReturnType extends IListEnsureResult {
  fieldsAdded: SPField[]
}

export interface IProjectDetails {
  /**
   * The item ID of the project.
   */
  id: number

  /**
   * The title of the project.
   */
  title: string

  /**
   * Is this project a parent project? Property `GtIsParentProject`
   * or `GtIsProgram` is set to `true` on the project item.
   */
  isParentProject: boolean
}

/**
 * Generates an error for when the user does not have access to the portfolio.
 *
 * @param url The URL of the portfolio
 */
export const NoAccessToPortfolioError = (url: string): ErrorWithIntent => {
  const error = new ErrorWithIntent(
    format(strings.NoAccessToPortfolioErrorText, url),
    'warning',
    strings.NoAccessToPortfolioErrorTitle
  )
  return error
}
