import { IListEnsureResult } from '@pnp/sp/lists'
import { SPField } from '../../models'
import { SPFxContext } from '../../types'
import strings from 'SharedLibraryStrings'
import { format } from '@fluentui/react'
import { ErrorWithIntent } from '../../interfaces'
import { LogLevel } from '@pnp/logging'

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
  | 'IDEA_PROJECT_DATA'
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
    IDEA_PROJECT_DATA?: string
    IDEA_PROCESSING?: string
    GLOBAL_SETTINGS?: string
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
    STATUS_SECTIONS: 'Statusseksjoner',
    PROJECT_COLUMNS: 'Prosjektkolonner',
    PROJECT_COLUMN_CONFIGURATION: 'Prosjektkolonnekonfigurasjon',
    PROJECT_STATUS: 'Prosjektstatus',
    PROJECT_STATUS_ATTACHMENTS: 'Prosjektstatusvedlegg',
    PROJECTS: 'Prosjekter',
    PORTFOLIO_VIEWS: 'Porteføljevisninger',
    PROJECT_CONTENT_COLUMNS: 'Prosjektinnholdskolonner',
    DATA_SOURCES: 'Datakilder',
    PROJECT_ADMIN_ROLES: 'Prosjektadministrasjonsroller',
    PROJECT_TEMPLATE_CONFIGURATION: 'Maloppsett',
    IDEA_PROJECT_DATA: 'Prosjektdata',
    IDEA_PROCESSING: 'Idébehandling',
    GLOBAL_SETTINGS: 'Globale innstillinger',
    TIMELINE_CONTENT: 'Tidslinjeinnhold'
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
  url: string
  listName: string
  contentTypeId: string
  properties?: Record<string, string>
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
