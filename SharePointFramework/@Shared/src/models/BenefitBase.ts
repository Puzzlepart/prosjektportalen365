import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';

export class BenefitBase {
    public path: string;
    public title: string;
    public webUrl: string;
    public siteTitle: string;
    public id: number;
    public siteId: string;

    constructor(result: IBenefitsSearchResult) {
        this.path = result.Path;
        this.title = result.Title;
        this.webUrl = result.SPWebURL;
        this.siteTitle = result.SiteTitle;
        this.id = parseInt(result.ListItemId, 10);
        this.siteId = result.SiteId;
    }
}