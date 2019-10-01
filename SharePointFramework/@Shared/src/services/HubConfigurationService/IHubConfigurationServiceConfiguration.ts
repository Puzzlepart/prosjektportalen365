import { Web } from '@pnp/sp';

export type HubConfigurationServiceList = 'statusSections' | 'projectColumns' | 'projectColumnConfiguration' | 'projectStatus' | 'portfolioViews';

export interface IHubConfigurationServiceConfiguration extends Object {
    urlOrWeb: string | Web;
    siteId?: string;
    webUrl?: string;
    listNames?: {
        statusSections: string,
        projectColumns: string,
        projectColumnConfiguration: string,
        projectStatus: string,
        portfolioViews: string,
    }
}

export const HubConfigurationServiceDefaultConfiguration: Partial<IHubConfigurationServiceConfiguration> = {
    listNames: {
        statusSections: 'Statusseksjoner',
        projectColumns: 'Prosjektkolonner',
        projectColumnConfiguration: 'Prosjektkolonnekonfigurasjon',
        projectStatus: 'Prosjektstatus',
        portfolioViews: 'Porteføljevisninger'
    }
}