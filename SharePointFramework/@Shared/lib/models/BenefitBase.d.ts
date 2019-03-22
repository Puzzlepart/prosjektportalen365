import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
export declare class BenefitBase {
    path: string;
    title: string;
    webUrl: string;
    siteTitle: string;
    id: number;
    siteId: string;
    constructor(result: IBenefitsSearchResult);
}
