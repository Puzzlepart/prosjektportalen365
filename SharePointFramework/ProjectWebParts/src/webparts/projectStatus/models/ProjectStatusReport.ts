import * as moment from 'moment';

export interface IProjectStatusReportItem {
    Id: number;
    GtYear: string;
    GtMonthChoice: string;
    [key: string]: any;
}

export default class ProjectStatusReport {
    public id: number;
    public item: IProjectStatusReportItem;
    public month: string;
    public year: number;
    public date: moment.Moment;
    public defaultEditFormUrl: string;

    /**
     * Constructor
     * 
     * @param {IProjectStatusReportItem} item Item
     * @param {string} editFormUrl Edit form url
     */
    constructor(item: IProjectStatusReportItem, defaultEditFormUrl?: string) {
        this.item = item;
        this.id = this.item.Id;
        this.month = item.GtMonthChoice;
        this.year = parseInt(item.GtYear, 10);
        this.date = moment({ month: this.monthIndex, year: this.year }).endOf('month');
        this.defaultEditFormUrl = defaultEditFormUrl;
    }

    /**
     * Month index
     */
    private get monthIndex() {
        return moment.months().indexOf(this.month.toLowerCase());
    }

    public get editFormUrl() {
        return [
            `${window.location.protocol}//${window.location.hostname}`,
            this.defaultEditFormUrl,
            `?ID=`,
            this.id,
            `&Source=`,
            encodeURIComponent(window.location.href),
        ].join('');
    }

    public toString(): string {
        return [this.month, this.year].join(' ');
    }
}