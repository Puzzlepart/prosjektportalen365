
import { IHubSite } from 'sp-hubsite-service';

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
    private hubSite: IHubSite;

    constructor(hubSite: IHubSite) {
        this.hubSite = hubSite;
    }

    public getProjectColumns(): Promise<ISpItemProjectColumn[]> {
        return this.hubSite.web.lists.getByTitle('Prosjektkolonner').items.get<ISpItemProjectColumn[]>();
    }
}