/* eslint-disable max-classes-per-file */
import { isArray } from 'underscore'

export class SPProjectAdminRoleItem {
  public ContentTypeId?: string = ''
  public Id?: number = -1
  public Title?: string = ''
  public GtGroupName?: string = ''
  public GtGroupLevel?: string = ''
  public GtProjectFieldName?: string = ''
  public GtProjectAdminPermissions?: string = ''
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
  public permissions: string[] = []

  /**
   * Constructor for `ProjectAdminRole`
   *
   * @param _item Item
   */
  constructor(private _item: SPProjectAdminRoleItem) {
    this.id = _item.Id
    this.title = _item.Title
    this.groupName = _item.GtGroupName
    this.groupLevel = _item.GtGroupLevel
    this.projectFieldName = _item.GtProjectFieldName ? `${_item.GtProjectFieldName}Id` : null
    if (isArray(_item.GtProjectAdminPermissions)) {
      this.permissions = _item.GtProjectAdminPermissions.map((p) => p.GtProjectAdminPermissionId)
    }
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
