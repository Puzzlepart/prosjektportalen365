import { IListEnsureResult } from '@pnp/sp/lists'
import { SPField } from '../../models'
import { SPFxContext } from '../../types'

export type PortalDataServiceList =
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

export interface IPortalDataServiceConfiguration extends Object {
  spfxContext?: SPFxContext
  listNames?: {
    STATUS_SECTIONS: string
    PROJECT_COLUMNS: string
    PROJECT_COLUMN_CONFIGURATION: string
    PROJECTS: string
    PROJECT_STATUS: string
    PROJECT_STATUS_ATTACHMENTS: string
    PORTFOLIO_VIEWS: string
    PROJECT_CONTENT_COLUMNS: string
    DATA_SOURCES: string
    PROJECT_ADMIN_ROLES: string
    PROJECT_TEMPLATE_CONFIGURATION: string
    IDEA_PROJECT_DATA: string
    IDEA_PROCESSING: string
    GLOBAL_SETTINGS: string
  }
  templateParametersFieldXml?: string
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
    GLOBAL_SETTINGS: 'Globale innstillinger'
  },
  templateParametersFieldXml:
    '<Field Type="Note" DisplayName="TemplateParameters" ID="{b8854944-7141-471f-b8df-53d93a4395ba}" StaticName="TemplateParameters" Name="TemplateParameters" UnlimitedLengthInDocumentLibrary="TRUE" Hidden="TRUE" />'
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
}

export interface ISyncListReturnType extends IListEnsureResult {
  fieldsAdded: SPField[]
}
