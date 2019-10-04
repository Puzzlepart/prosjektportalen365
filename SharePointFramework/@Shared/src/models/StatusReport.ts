import { TypedHash } from '@pnp/common';

export class StatusReport {
    public id: number;
    public created: Date;
    public defaultEditFormUrl: string;

    /**
     * Creates a new instance of StatusReport
     * 
     * @param {any} item SP item
     */
    constructor(private _item: any) {
        this.id = _item.Id;
        this.created = new Date(_item.Created);
    }

    public setDefaultEditFormUrl(defaultEditFormUrl: string) {
        this.defaultEditFormUrl = defaultEditFormUrl;
        return this;
    }

    /**
     * Get url for the report page
     * 
     * @param {string} urlSourceParam Source param
     */
    public url(urlSourceParam: string) {
        return `SitePages/Prosjektstatus.aspx?selectedReport=${this.id}&Source=${encodeURIComponent(urlSourceParam)}`;
    }

    /**
     * Get status values from item
     */
    public get statusValues(): TypedHash<string> {
        return Object.keys(this._item)
            .filter(fieldName => fieldName.indexOf('Status') !== -1 && fieldName.indexOf('Gt') === 0)
            .reduce((obj, fieldName) => {
                obj[fieldName] = this._item[fieldName];
                return obj;
            }, {});
    }

    /**
     * Field values
     */
    public get fieldValues(): TypedHash<string> {
        return this._item;
    }

    /**
     * Get status values from item
     * 
     * @param {string} fieldName Field name
     */
    public getStatusValue(fieldName: string): { value: string, comment: string } {
        return { value: this._item[fieldName], comment: this._item[`${fieldName}Comment`] };
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