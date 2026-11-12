import { isArray } from 'underscore'

/**
 * Represents a stored project-administration role.
 */
export class SPProjectAdminRoleItem {
  public ContentTypeId?: string = ''
  public Id?: number = -1
  public Title?: string = ''
  public GtGroupName?: string = ''
  public GtGroupLevel?: string = ''
  public GtProjectFieldName?: string = ''
  public GtProjectAdminPermissions?: string = ''
}

/**
 * Identifies how an administration role determines membership.
 */
export enum ProjectAdminRoleType {
  ProjectProperty,
  SharePointGroup,
  SiteAdmin
}

/**
 * Resolves role membership settings and granted project permissions.
 */
export class ProjectAdminRole {
  /**
   * SharePoint list item ID of the role.
   */
  public id: number

  public title: string

  public groupName: string

  /**
   * The level of the group. Can be `Lists_ProjectAdminRoles_GroupLevel_Project`
   * or `Lists_ProjectAdminRoles_GroupLevel_Portfolio` from `SharedResources`.
   */
  public groupLevel: string

  /**
   * The name of the field on the project that contains the user id.
   */
  public projectFieldName: string

  public permissions: string[] = []

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
