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
export declare class HubConfigurationService {
    private web;
    constructor(hubSiteUrl: string);
    getProjectColumns(): Promise<ISpItemProjectColumn[]>;
}
