import { stringIsNullOrEmpty } from '@pnp/common';
import { Web } from '@pnp/sp';


export interface IListContentConfigSPItem {
    GtLccDestinationList: string;
    GtLccDestinationLibrary: string;
    GtLccFields: string;
    GtLccDefault: boolean;
    Id: number;
    Title: string;
    GtLccSourceList: string;
}

export class ListContentConfig {
    public title: string;
    public sourceList: string;
    public destinationList: string;
    public destinationLibrary: string;
    public isDefault: boolean;

    constructor(private _spItem: IListContentConfigSPItem, private _web: Web) {
        this.title = this._spItem.Title;
        this.sourceList = this._spItem.GtLccSourceList;
        this.destinationList = this._spItem.GtLccDestinationList;
        this.destinationLibrary = this._spItem.GtLccDestinationLibrary;
        this.isDefault = this._spItem.GtLccDefault;
    }

    public get key() {
        return `listcontentconfig_${this._spItem.Id.toString()}`;
    }

    public get fields() {
        return !stringIsNullOrEmpty(this._spItem.GtLccFields) ? this._spItem.GtLccFields.split(',') : [];
    }

    public get list() {
        return this._web.lists.getByTitle(this.sourceList);
    }
}
