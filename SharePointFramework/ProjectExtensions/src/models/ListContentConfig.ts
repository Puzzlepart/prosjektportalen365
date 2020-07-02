import { stringIsNullOrEmpty } from '@pnp/common'
import { sp, Web, List } from '@pnp/sp'
import { IListProperties } from './IListProperties'
import { IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown'

export interface IListContentConfigSPItem {
    ContentTypeId: string;
    Id: number;
    Title: string;
    GtDescription: string;
    GtLccDestinationList: string;
    GtLccFields: string;
    GtLccDefault: boolean;
    GtLccSourceList: string;
    GtLccHidden: boolean;
}

export enum ListContentConfigType {
    List,
    Planner
}

/**
 * @model ListContentConfig
 */
export class ListContentConfig implements IDropdownOption {
    public id: number;
    public key: string;
    public text: string;
    public subText: string;
    public isDefault: boolean;
    public hidden: boolean;
    public sourceListProps: IListProperties = {};
    public destListProps: IListProperties = {};
    private _sourceList: string;
    private _destinationList: string;

    constructor(private _spItem: IListContentConfigSPItem, public web: Web) {
        this.id = _spItem.Id
        this.key = `listcontentconfig_${this.id}`
        this.text = _spItem.Title
        this.subText = _spItem.GtDescription
        this.isDefault = _spItem.GtLccDefault
        this.hidden = _spItem.GtLccHidden
        this._sourceList = _spItem.GtLccSourceList
        this._destinationList = _spItem.GtLccDestinationList
    }

    public get type(): ListContentConfigType {
        if (this._spItem.ContentTypeId.indexOf('0x0100B8B4EE61A547B247B49CFC21B67D5B7D01') !== -1) return ListContentConfigType.Planner
        return ListContentConfigType.List
    }
    public get fields() {
        return !stringIsNullOrEmpty(this._spItem.GtLccFields) ? this._spItem.GtLccFields.split(',') : []
    }

    public get sourceList(): List {
        return this.web.lists.getByTitle(this._sourceList)
    }

    public get destList(): List {
        return sp.web.lists.getByTitle(this._destinationList)
    }

    public async load() {
        this.sourceListProps = await this.sourceList.select('Title', 'ListItemEntityTypeFullName', 'ItemCount', 'BaseTemplate').expand('RootFolder').get<IListProperties>()
        if (this.type === ListContentConfigType.List) {
            this.destListProps = await this.destList.select('Title', 'ListItemEntityTypeFullName', 'ItemCount', 'BaseTemplate').expand('RootFolder').get<IListProperties>()
        }
    }
}
