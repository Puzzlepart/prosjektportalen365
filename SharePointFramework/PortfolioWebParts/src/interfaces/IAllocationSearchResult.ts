import { SearchResult } from '@pnp/sp';

export interface IAllocationSearchResult extends SearchResult {
    RefinableString71: string;
    RefinableString72: string;
    GtResourceLoadOWSNMBR: string;
    GtResourceAbsenceOWSCHCS: string;
    GtStartDateOWSDATE: string;
    GtEndDateOWSDATE: string;
    SiteTitle: string;
}