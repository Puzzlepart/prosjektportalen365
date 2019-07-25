export interface IProjectStatusConfigSpItem {
    Id?: number;
    GtPortfolioColumnId?: number;
    GtStatusValue?: string;
    GtStatusColor?: string;
    GtStatusIconName?: string;
}

export type ProjectStatusConfigDictionary = { [key: string]: { statusColor: string, statusIconName: string } };

export class ProjectStatusConfig  {
    public id?: number;
    public columnId?: number;
    public statusValue?: string;
    public statusColor?: string;
    public statusIconName?: string;

    constructor(item: IProjectStatusConfigSpItem) {
        this.id = item.Id;
        this.columnId = item.GtPortfolioColumnId;
        this.statusValue = item.GtStatusValue;
        this.statusColor = item.GtStatusColor;
        this.statusIconName = item.GtStatusIconName;
    }
}
