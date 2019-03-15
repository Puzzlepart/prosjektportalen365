import { Web } from '@pnp/sp';

export interface ISpItemProjectColumn {
    Title: string;
    GtSortOrder: number;
    GtInternalName: string;
    GtManagedProperty?: any;
    GtShowFieldProjectStatus: boolean;
    GtShowFieldFrontpage: boolean;
    GtShowFieldPortfolio: boolean;
    GtFieldDataType: string;
}

export class HubConfigurationService {
    private web: Web;

    constructor(hubSiteUrl: string) {
        this.web = new Web(hubSiteUrl);
    }

    public getProjectColumns(): Promise<ISpItemProjectColumn[]> {
        return this.web.lists.getByTitle('Prosjektkolonner').items.get<ISpItemProjectColumn[]>();
    }
}