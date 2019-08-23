
import { SearchResult } from '@pnp/sp';


export interface IFetchDataForViewItemResult extends SearchResult {
    SiteId: string;
    [key: string]: any;
}

export class FetchDataForViewRefinerEntryResult {
    constructor(
        public name: string,
        public value: string,
        public token?: string,
        public count?: number) { }
}

export interface IFetchDataForViewRefinersResult {
    [key: string]: FetchDataForViewRefinerEntryResult[];
}

export interface IFetchDataForViewResult {
    items: IFetchDataForViewItemResult[];
    refiners: IFetchDataForViewRefinersResult;
}
