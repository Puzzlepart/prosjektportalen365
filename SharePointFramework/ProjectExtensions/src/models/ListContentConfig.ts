import { stringIsNullOrEmpty } from '@pnp/common';
import { sp, Web, List } from '@pnp/sp';
import { IListProperties } from './IListProperties';


export interface IListContentConfigSPItem {
    Id: number;
    Title: string;
    ContentTypeId: string;
    GtLccDestinationList: string;
    GtLccFields: string;
    GtLccDefault: boolean;
    GtLccSourceList: string;
}

export enum ListContentConfigType {
    List,
    Planner
}

export class ListContentConfig {
    public title: string;
    public isDefault: boolean;
    public sourceListProps: IListProperties = {};
    public destListProps: IListProperties = {};
    private _sourceList: string;
    private _destinationList: string;

    constructor(private _spItem: IListContentConfigSPItem, public web: Web) {
        this.title = this._spItem.Title;
        this._sourceList = this._spItem.GtLccSourceList;
        this._destinationList = this._spItem.GtLccDestinationList;
        this.isDefault = this._spItem.GtLccDefault;
    }

    public get type(): ListContentConfigType {
        if (this._spItem.ContentTypeId.indexOf('0x0100B8B4EE61A547B247B49CFC21B67D5B7D01') !== -1) return ListContentConfigType.Planner;
        return ListContentConfigType.List;
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
        this.sourceListProps = await this.sourceList.select('Title', 'ListItemEntityTypeFullName', 'ItemCount', 'BaseTemplate').expand('RootFolder').get<IListProperties>();
        if (this.type === ListContentConfigType.List) {
            this.destListProps = await this.destList.select('Title', 'ListItemEntityTypeFullName', 'ItemCount', 'BaseTemplate').expand('RootFolder').get<IListProperties>();
        }
    }
}
