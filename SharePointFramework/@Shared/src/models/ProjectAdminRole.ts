/* eslint-disable max-classes-per-file */

export class SPProjectAdminRoleItem {
  public ContentTypeId?: string = ''
  public Id?: number = -1
  public Title?: string = ''
  public GtGroupName?: string = ''
  public GtGroupLevel?: string = ''
  public GtProjectFieldName?: string = ''
}

export enum ProjectAdminRoleType {
  ProjectProperty,
  SharePointGroup,
  SiteAdmin
}

export class ProjectAdminRole {
  public id: number
  public title: string
  public groupName: string
  public groupLevel: string
  public projectFieldName: string

  /**
   * Constructor for ProjectAdminRole
   *
   * @param _item Item
   */
  constructor(private _item: SPProjectAdminRoleItem) {
    this.id = _item.Id
    this.title = _item.Title
    this.groupName = _item.GtGroupName
    this.groupLevel = _item.GtGroupLevel
    this.projectFieldName = _item.GtProjectFieldName ? `${_item.GtProjectFieldName}Id` : null
  }

  public get type(): ProjectAdminRoleType {
    if (this._item.ContentTypeId.indexOf('0x0100618197F7C782A0459EB2FA5EBF1BDDF201') !== -1) {
      return ProjectAdminRoleType.ProjectProperty
    }
    if (this._item.ContentTypeId.indexOf('0x0100618197F7C782A0459EB2FA5EBF1BDDF202') !== -1) {
      return ProjectAdminRoleType.SharePointGroup
    }
    if (this._item.ContentTypeId.indexOf('0x0100618197F7C782A0459EB2FA5EBF1BDDF203') !== -1) {
      return ProjectAdminRoleType.SiteAdmin
    }
  }
}
