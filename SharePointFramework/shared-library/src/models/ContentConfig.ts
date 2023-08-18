import { stringIsNullOrEmpty } from '@pnp/core'
import { SPFI } from '@pnp/sp'
import { IList } from '@pnp/sp/lists'
import { IWeb } from '@pnp/sp/webs'
import { IListProperties } from '../interfaces/IListProperties'
import { ProjectTemplate } from './ProjectTemplate'
import { UserSelectableObject } from './UserSelectableObject'

export interface IContentConfigSPItem {
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
  GtPlannerName: string
}

export enum ContentConfigType {
  List,
  Planner
}

/**
 * @model ContentConfig
 */
export class ContentConfig extends UserSelectableObject {
  public sourceListProps: IListProperties = {}
  public destListProps: IListProperties = {}
  public plannerTitle: string
  private _sourceListName: string
  private _destinationListName: string

  constructor(private _spItem: IContentConfigSPItem, public web: IWeb, private _sp?: SPFI) {
    super(
      _spItem.Id,
      _spItem.Title,
      _spItem.GtDescription,
      _spItem.GtLccDefault,
      _spItem.GtLccLocked,
      _spItem.GtLccHidden
    )
    this.plannerTitle = _spItem.GtPlannerName ?? _spItem.Title
    this._sourceListName = _spItem.GtLccSourceList
    this._destinationListName = _spItem.GtLccDestinationList
  }

  /**
   * Checks if the content config is mandatory for the specified template. It's either
   * locked and default on the content configuration element itself, or it's connected to the
   * template and `isDefaultContentConfigLocked` is set to true.
   *
   * @param template Project template
   */
  public isMandatoryForTemplate(template: ProjectTemplate): boolean {
    return (
      (this.isLocked && this.isDefault) ||
      (template?.isDefaultContentConfigLocked && template?.contentConfig.includes(this.id))
    )
  }

  /**
   * Checks if the content config is default for the specified template. It's either
   * default on the content configuration element itself, or it's connected to the template.
   *
   * @param template Project template
   */
  public isDefaultForTemplate(template?: ProjectTemplate): boolean {
    return this.isDefault || template?.contentConfig.includes(this.id)
  }

  public get type(): ContentConfigType {
    if (this._spItem.ContentTypeId.indexOf('0x0100B8B4EE61A547B247B49CFC21B67D5B7D01') !== -1)
      return ContentConfigType.Planner
    return ContentConfigType.List
  }
  public get fields() {
    return !stringIsNullOrEmpty(this._spItem.GtLccFields) ? this._spItem.GtLccFields.split(',') : []
  }

  public get sourceList(): IList {
    return this.web.lists.getByTitle(this._sourceListName)
  }

  public get destList(): IList {
    return this._sp.web.lists.getByTitle(this._destinationListName)
  }

  public async load() {
    this.sourceListProps = await this.sourceList
      .select('Title', 'ListItemEntityTypeFullName', 'ItemCount', 'BaseTemplate')
      .expand('RootFolder')<IListProperties>()
    if (this.type === ContentConfigType.List) {
      this.destListProps = await this.destList
        .select('Title', 'ListItemEntityTypeFullName', 'ItemCount', 'BaseTemplate')
        .expand('RootFolder')<IListProperties>()
    }
  }
}
