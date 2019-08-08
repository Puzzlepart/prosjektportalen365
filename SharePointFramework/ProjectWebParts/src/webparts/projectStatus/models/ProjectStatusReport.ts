import * as moment from 'moment';

export default class ProjectStatusReport {
    public id: number;
    public item: { [key: string]: any };
    public month: string;
    public year: number;
    public date: moment.Moment;
    public defaultEditFormUrl: string;

    /**
     * Constructor
     * 
     * @param {Object} item Item
     * @param {string} editFormUrl Edit form url
     */
    constructor(item: { [key: string]: any }, defaultEditFormUrl?: string) {
        this.item = item;
        this.id = this.item.Id;
        this.month = item.GtMonthChoice;
        this.year = parseInt(item.GtYear, 10);
        this.date = moment({ month: this.monthIndex, year: this.year }).endOf('month');
        this.defaultEditFormUrl = defaultEditFormUrl;
    }

    /**
     * Get status values from item
     */
    public getStatusValues(): { [key: string]: string } {
        return Object.keys(this.item)
            .filter(fieldName => fieldName.indexOf('Status') !== -1 && fieldName.indexOf('Gt') === 0)
            .reduce((obj, fieldName) => {
                obj[fieldName] = this.item[fieldName];
                return obj;
            }, {});
    }

    /**
     * Month index
     */
    public get monthIndex() {
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