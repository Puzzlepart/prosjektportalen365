import { PortfolioOverviewColumn } from ".";

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

export class PortfolioOverviewView {
    public id: number;
    public title: string;
    public sortOrder: number;
    public searchQuery: string;
    public isDefaultView: boolean;
    public iconName: string;
    public isPersonal: boolean;
    public columns: PortfolioOverviewColumn[];
    public refiners: PortfolioOverviewColumn[];
    public groupBy?: PortfolioOverviewColumn;
    public scope?: string;

    constructor(item: IPortfolioOverviewViewSpItem, columns: PortfolioOverviewColumn[]) {
        this.id = item.Id;
        this.title = item.Title;
        this.sortOrder = item.GtSortOrder;
        this.searchQuery = item.GtSearchQuery;
        this.isDefaultView = item.GtPortfolioIsDefaultView;
        this.iconName = item.GtPortfolioFabricIcon;
        this.isPersonal = item.GtPortfolioIsPersonalView;
        this.columns = item.GtPortfolioColumnsId.map(id => columns.filter(col => col.id === id)[0]).sort((a, b) => a.sortOrder - b.sortOrder);
        this.refiners = item.GtPortfolioRefinersId.map(id => columns.filter(col => col.id === id)[0]).sort((a, b) => a.sortOrder - b.sortOrder);
        this.groupBy = columns.filter(col => col.id === item.GtPortfolioGroupById)[0];
    }
}
