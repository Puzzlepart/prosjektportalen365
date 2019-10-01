import * as _ from 'underscore';
import { ProjectColumn } from './ProjectColumn';

export class SPPortfolioOverviewViewItem {
    // tslint:disable-next-line: naming-convention
    public Id: number = 0;
    // tslint:disable-next-line: naming-convention
    public Title: string = '';
    // tslint:disable-next-line: naming-convention
    public GtSortOrder: number = 0;
    // tslint:disable-next-line: naming-convention
    public GtSearchQuery: string = '';
    // tslint:disable-next-line: naming-convention
    public GtPortfolioIsDefaultView: boolean = false;
    // tslint:disable-next-line: naming-convention
    public GtPortfolioFabricIcon: string = '';
    // tslint:disable-next-line: naming-convention
    public GtPortfolioIsPersonalView: boolean = false;
    // tslint:disable-next-line: naming-convention
    public GtPortfolioColumnsId: number[] = [];
    // tslint:disable-next-line: naming-convention
    public GtPortfolioRefinersId: number[] = [];
    // tslint:disable-next-line: naming-convention
    public GtPortfolioGroupById: number = 0;
}

export class PortfolioOverviewView {
    public id: number;
    public title: string;
    public sortOrder: number;
    public searchQuery: string;
    public isDefaultView: boolean;
    public iconName: string;
    public isPersonal: boolean;
    public columns: ProjectColumn[];
    public refiners: ProjectColumn[];
    public groupBy?: ProjectColumn;
    public scope?: string;

    constructor(private _item: SPPortfolioOverviewViewItem) {
        this.id = _item.Id;
        this.title = _item.Title;
        this.sortOrder = _item.GtSortOrder;
        this.searchQuery = _item.GtSearchQuery;
        this.isDefaultView = _item.GtPortfolioIsDefaultView;
        this.iconName = _item.GtPortfolioFabricIcon;
        this.isPersonal = _item.GtPortfolioIsPersonalView;
    }

    public configure(columns: ProjectColumn[] = []): PortfolioOverviewView {
        this.columns = this._item.GtPortfolioColumnsId.map(id => _.find(columns, col => col.id === id)).sort((a, b) => a.sortOrder - b.sortOrder);
        this.refiners = this._item.GtPortfolioRefinersId.map(id => _.find(columns, col => col.id === id)).sort((a, b) => a.sortOrder - b.sortOrder);
        this.groupBy = _.find(columns, col => col.id === this._item.GtPortfolioGroupById);
        return this;
    }
}
