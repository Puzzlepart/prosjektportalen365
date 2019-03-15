import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';

export class BenefitBase {
    public path: string;
    public title: string;
    public siteTitle: string;
    public id: number;
    public siteId: string;

    constructor(result: IBenefitsSearchResult) {
        this.path = result.Path;
        this.title = result.Title;
        this.siteTitle = result.SiteTitle;
        this.id = parseInt(result.ListItemId, 10);
        this.siteId = result.SiteId;
    }
}