export interface IProjectStatusReportItem {
    Id: number;
    GtMonthChoice: string;
    Created: string;
    [key: string]: any;
}

export default class ProjectStatusReport {
    public item: IProjectStatusReportItem;

    constructor(item: IProjectStatusReportItem) {
        this.item = item;
    }

    public toString() {
        return `${this.item.GtMonthChoice} ${this.item.Created.substring(0, 4)}`;
    }
}