import { PageContext } from '@microsoft/sp-page-context'

export type PortalDataServiceList =
  | 'STATUS_SECTIONS'
  | 'PROJECT_COLUMNS'
  | 'PROJECT_COLUMN_CONFIGURATION'
  | 'PROJECT_STATUS'
  | 'PORTFOLIO_VIEWS'
  | 'PROJECT_CONTENT_COLUMNS'
  | 'DATA_SOURCES'

export interface IPortalDataServiceConfiguration extends Object {
  pageContext?: PageContext
  listNames?: {
    STATUS_SECTIONS: string
    PROJECT_COLUMNS: string
    PROJECT_COLUMN_CONFIGURATION: string
    PROJECTS: string
    PROJECT_STATUS: string
    PORTFOLIO_VIEWS: string
    PROJECT_CONTENT_COLUMNS: string
    DATA_SOURCES: string
    PROJECT_ADMIN_ROLES: string
  }
  templateParametersFieldXml?: string
}

export const PortalDataServiceDefaultConfiguration: Partial<IPortalDataServiceConfiguration> = {
  listNames: {
    STATUS_SECTIONS: 'Statusseksjoner',
    PROJECT_COLUMNS: 'Prosjektkolonner',
    PROJECT_COLUMN_CONFIGURATION: 'Prosjektkolonnekonfigurasjon',
    PROJECT_STATUS: 'Prosjektstatus',
    PROJECTS: 'Prosjekter',
    PORTFOLIO_VIEWS: 'Porteføljevisninger',
    PROJECT_CONTENT_COLUMNS: 'Prosjektinnholdskolonner',
    DATA_SOURCES: 'Datakilder',
    PROJECT_ADMIN_ROLES: 'Prosjektadministrasjonsroller'
  },
  templateParametersFieldXml:
    '<Field Type="Note" DisplayName="TemplateParameters" ID="{b8854944-7141-471f-b8df-53d93a4395ba}" StaticName="TemplateParameters" Name="TemplateParameters" UnlimitedLengthInDocumentLibrary="TRUE" Hidden="TRUE" />'
}
