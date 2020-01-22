import { stringIsNullOrEmpty } from '@pnp/common';
import { sp, Web, List } from '@pnp/sp';
import { IListProperties } from './IListProperties';


export interface IListContentConfigSPItem {
    GtLccDestinationList: string;
    GtLccFields: string;
    GtLccDefault: boolean;
    Id: number;
    Title: string;
    GtLccSourceList: string;
}

export class ListContentConfig {
    public title: string;
    public isDefault: boolean;
    public sourceListProps: IListProperties;
    public destListProps: IListProperties;
    private _sourceList: string;
    private _destinationList: string;

    constructor(private _spItem: IListContentConfigSPItem, public web: Web) {
        this.title = this._spItem.Title;
        this._sourceList = this._spItem.GtLccSourceList;
        this._destinationList = this._spItem.GtLccDestinationList;
        this.isDefault = this._spItem.GtLccDefault;
    }

    public get key() {
        return `listcontentconfig_${this._spItem.Id.toString()}`;
    }

    public get fields() {
        return !stringIsNullOrEmpty(this._spItem.GtLccFields) ? this._spItem.GtLccFields.split(',') : [];
    }

    public get sourceList(): List {
        return this.web.lists.getByTitle(this._sourceList);
    }

    public get destList(): List {
        return sp.web.lists.getByTitle(this._destinationList);
    }

    public async load() {
        const [sourceListProps, destListProps] = await Promise.all([
            this.sourceList.select('Title', 'ListItemEntityTypeFullName', 'ItemCount', 'BaseTemplate').expand('RootFolder').get<IListProperties>(),
            this.destList.select('Title', 'ListItemEntityTypeFullName', 'ItemCount', 'BaseTemplate').expand('RootFolder').get<IListProperties>(),
        ]);
        this.sourceListProps = sourceListProps;
        this.destListProps = destListProps;
    }
}
