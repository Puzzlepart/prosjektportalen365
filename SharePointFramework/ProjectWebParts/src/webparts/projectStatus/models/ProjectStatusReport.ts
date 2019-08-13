export default class ProjectStatusReport {
    public id: number;
    public item: { [key: string]: any };
    public date: Date;
    public defaultEditFormUrl: string;

    /**
     * Constructor
     * 
     * @param {Object} item Item
     * @param {string} defaultEditFormUrl Default edit form url
     */
    constructor(item: { [key: string]: any }, defaultEditFormUrl?: string) {
        this.item = item;
        this.id = this.item.Id;
        this.date = new Date(item.Created);
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
}