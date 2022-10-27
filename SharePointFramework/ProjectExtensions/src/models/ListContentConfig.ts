import { IObjectWithKey } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import { List, sp, Web } from '@pnp/sp'
import { IListProperties } from './IListProperties'
import { ProjectTemplate } from './ProjectTemplate'

export interface IListContentConfigSPItem {
  ContentTypeId: string
  Id: number
  Title: string
  GtDescription: string
  GtLccDestinationList: string
  GtLccFields: string
  GtLccDefault: boolean
  GtLccSourceList: string
  GtLccHidden: boolean
  GtLccLocked: boolean
}

export enum ListContentConfigType {
  List,
  Planner
}

/**
 * @model ListContentConfig
 */
export class ListContentConfig implements IObjectWithKey {
  public id: number
  public key: string
  public text: string
  public subText: string
  public isDefault: boolean
  public hidden: boolean
  public sourceListProps: IListProperties = {}
  public destListProps: IListProperties = {}
  private _isLocked: boolean
  private _sourceList: string
  private _destinationList: string

  constructor(private _spItem: IListContentConfigSPItem, public web: Web) {
    this.id = _spItem.Id
    this.key = this.id.toString()
    this.text = _spItem.Title
    this.subText = _spItem.GtDescription
    this.isDefault = _spItem.GtLccDefault
    this._isLocked = _spItem.GtLccLocked
    this.hidden = this._isLocked && !this.isDefault ? true : _spItem.GtLccHidden
    this._sourceList = _spItem.GtLccSourceList
    this._destinationList = _spItem.GtLccDestinationList
  }

  /**
   * Checks if the list content config is locked for the specified template
   *
   * @param template Project template
   */
  public isLocked(template: ProjectTemplate): boolean {
    return (
      this._isLocked ||
      (template?.isDefaultListContentLocked && template?.listContentConfigIds.includes(this.id))
    )
  }

  public get type(): ListContentConfigType {
    if (this._spItem.ContentTypeId.indexOf('0x0100B8B4EE61A547B247B49CFC21B67D5B7D01') !== -1)
      return ListContentConfigType.Planner
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
    this.sourceListProps = await this.sourceList
      .select('Title', 'ListItemEntityTypeFullName', 'ItemCount', 'BaseTemplate')
      .expand('RootFolder')
      .get<IListProperties>()
    if (this.type === ListContentConfigType.List) {
      this.destListProps = await this.destList
        .select('Title', 'ListItemEntityTypeFullName', 'ItemCount', 'BaseTemplate')
        .expand('RootFolder')
        .get<IListProperties>()
    }
  }
}
