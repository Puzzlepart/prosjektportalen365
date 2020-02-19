import { Web } from '@pnp/sp';

export type PortalDataServiceList = 'STATUS_SECTIONS' | 'PROJECT_COLUMNS' | 'PROJECT_COLUMN_CONFIGURATION' | 'PROJECT_STATUS' | 'PORTFOLIO_VIEWS';

export interface IPortalDataServiceConfiguration extends Object {
    urlOrWeb: string | Web;
    siteId?: string;
    webUrl?: string;
    listNames?: {
        STATUS_SECTIONS: string,
        PROJECT_COLUMNS: string,
        PROJECT_COLUMN_CONFIGURATION: string,
        PROJECT_STATUS: string,
        PORTFOLIO_VIEWS: string,
    };
    templateParametersFieldXml: string;
}

// tslint:disable-next-line: naming-convention
export const PortalDataServiceDefaultConfiguration: Partial<IPortalDataServiceConfiguration> = {
    listNames: {
        STATUS_SECTIONS: 'Statusseksjoner',
        PROJECT_COLUMNS: 'Prosjektkolonner',
        PROJECT_COLUMN_CONFIGURATION: 'Prosjektkolonnekonfigurasjon',
        PROJECT_STATUS: 'Prosjektstatus',
        PORTFOLIO_VIEWS: 'Porteføljevisninger'
    },
    templateParametersFieldXml: '<Field Type="Note" DisplayName="TemplateParameters" ID="{b8854944-7141-471f-b8df-53d93a4395ba}" StaticName="TemplateParameters" Name="TemplateParameters" UnlimitedLengthInDocumentLibrary="TRUE" Hidden="TRUE" />',
}