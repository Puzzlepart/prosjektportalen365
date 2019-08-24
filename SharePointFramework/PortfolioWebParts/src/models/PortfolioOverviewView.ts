import { PortfolioOverviewColumn, SPPortfolioOverviewViewItem } from '.';
import * as _ from 'underscore';

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

    constructor(item: SPPortfolioOverviewViewItem, columns: PortfolioOverviewColumn[]) {
        this.id = item.Id;
        this.title = item.Title;
        this.sortOrder = item.GtSortOrder;
        this.searchQuery = item.GtSearchQuery;
        this.isDefaultView = item.GtPortfolioIsDefaultView;
        this.iconName = item.GtPortfolioFabricIcon;
        this.isPersonal = item.GtPortfolioIsPersonalView;
        this.columns = item.GtPortfolioColumnsId.map(id => _.find(columns, col => col.id === id)).sort((a, b) => a.sortOrder - b.sortOrder);
        this.refiners = item.GtPortfolioRefinersId.map(id => _.find(columns, col => col.id === id)).sort((a, b) => a.sortOrder - b.sortOrder);
        this.groupBy = _.find(columns, col => col.id === item.GtPortfolioGroupById);
    }
}
