import { PortfolioOverviewColumn } from "models";

export interface IPortfolioOverviewViewSpItem {
    Id: number;
    Title: string;
    GtSortOrder: number;
    GtSearchQuery: string;
    GtPortfolioIsDefaultView: boolean;
    GtPortfolioFabricIcon: string;
    GtPortfolioIsPersonalView: boolean;
    GtPortfolioColumnsId: number[];
    GtPortfolioRefinersId: number[];
    GtPortfolioGroupById?: number;
    GtPortfolioColumns: PortfolioOverviewColumn[];
    GtPortfolioRefiners: PortfolioOverviewColumn[];
    GtPortfolioGroupBy?: PortfolioOverviewColumn;
}