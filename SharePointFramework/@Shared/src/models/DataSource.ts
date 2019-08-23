export class SPDataSourceItem {
    public Id?: number = -1;
    public Title?: string = '';
    public GtIconName?: string = '';
    public GtSearchQuery?: string = '';
    public GtDataSourceCategory?: string = '';
    public GtDataSourceDefault?: boolean = false;
}

export class DataSource {
    public id: number;
    public title: string;
    public iconName: string;
    public searchQuery: string;
    public category: string;
    public isDefault: boolean;

    /**
     * DataSource
     * 
     * @param {SPDataSourceItem} item Item
     */
    constructor(public item: SPDataSourceItem) {
        this.id = item.Id;
        this.title = item.Title;
        this.iconName = item.GtIconName;
        this.searchQuery = item.GtSearchQuery;
        this.category = item.GtDataSourceCategory;
        this.isDefault = item.GtDataSourceDefault;
    }
}