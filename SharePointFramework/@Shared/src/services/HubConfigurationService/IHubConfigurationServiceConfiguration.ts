import { Web } from '@pnp/sp';

export type HubConfigurationServiceList = 'STATUS_SECTIONS' | 'PROJECT_COLUMNS' | 'PROJECT_COLUMN_CONFIGURATION' | 'PROJECT_STATUS' | 'PORTFOLIO_VIEWS';

export interface IHubConfigurationServiceConfiguration extends Object {
    urlOrWeb: string | Web;
    siteId?: string;
    webUrl?: string;
    listNames?: {
        STATUS_SECTIONS: string,
        PROJECT_COLUMNS: string,
        PROJECT_COLUMN_CONFIGURATION: string,
        PROJECT_STATUS: string,
        PORTFOLIO_VIEWS: string,
    }
}

export const HubConfigurationServiceDefaultConfiguration: Partial<IHubConfigurationServiceConfiguration> = {
    listNames: {
        STATUS_SECTIONS: 'Statusseksjoner',
        PROJECT_COLUMNS: 'Prosjektkolonner',
        PROJECT_COLUMN_CONFIGURATION: 'Prosjektkolonnekonfigurasjon',
        PROJECT_STATUS: 'Prosjektstatus',
        PORTFOLIO_VIEWS: 'Porteføljevisninger'
    }
}