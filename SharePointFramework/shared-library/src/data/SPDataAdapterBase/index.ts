import { format } from '@fluentui/react'
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { SPUser } from '@microsoft/sp-page-context'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { dateAdd, IPnPClientStore, PnPClientStorage } from '@pnp/core'
import { SPFI } from '@pnp/sp'
import '@pnp/sp/presets/all'
import { IWeb, PermissionKind } from '@pnp/sp/presets/all'
import { SpEntityPortalService } from 'sp-entityportal-service'
import _ from 'underscore'
import { ProjectAdminRoleType } from '../../models'
import { PortalDataService } from '../../services/PortalDataService'
import { createSpfiInstance } from '../createSpfiInstance'
import { ISPDataAdapterBaseConfiguration } from './ISPDataAdapterBaseConfiguration'
import { ProjectAdminPermission } from './ProjectAdminPermission'

export class SPDataAdapterBase<T extends ISPDataAdapterBaseConfiguration> {
  public settings: T
  public portal: PortalDataService
  public entityService: SpEntityPortalService
  public sp: SPFI
  public isConfigured: boolean = false
  public spfxContext: ApplicationCustomizerContext | ListViewCommandSetContext | WebPartContext
  private _storage: IPnPClientStore
  private _storageKeys: Record<string, string> = {
    getProjectAdminPermissions: '{0}_project_admin_permissions'
  }

  /**
   * Initialize storage
   */
  private _initStorage() {
    this._storage = new PnPClientStorage().session
    this._storageKeys = Object.keys(this._storageKeys).reduce((obj, key) => {
      obj[key] = format(this._storageKeys[key], this.settings.siteId.replace(/-/g, ''))
      return obj
    }, {})
    this._storage.deleteExpired()
  }

  /**
   * Get storage key for function
   *
   * @param func Function name
   */
  public getStorageKey(func: string) {
    return this._storageKeys[func]
  }

  /**
   * Configure the SP data adapter
   *
   * @param spfxContext Context
   * @param settings Settings
   */
  public async configure(spfxContext: any, settings: T) {
    this.spfxContext = spfxContext
    this.settings = settings
    this.sp = createSpfiInstance(spfxContext)
    this.portal = await new PortalDataService().configure({
      spfxContext
    })
    this.entityService = new SpEntityPortalService({
      portalUrl: this.portal.url,
      listName: 'Prosjekter',
      contentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
      identityFieldName: 'GtSiteId',
      urlFieldName: 'GtSiteUrl'
    })
    this._initStorage()
    this.isConfigured = true
  }

  /**
   * Ensure current user and return it.
   *
   * @param user User
   */
  private async getCurrentUser(user: SPUser) {
    try {
      const { data: currentUser } = await this.sp.web.ensureUser(user.loginName ?? user.email)
      return currentUser
    } catch {
      return null
    }
  }

  /**
   * Check project admin permissions. The result is stored in `sessionStorage`
   * for `expireMinutes` _(default 10)_ minutes to avoid too many requests.
   *
   * @param permission Permission to check
   * @param properties Project properties
   * @param expireMinutes Expiry in minutes (default 10)
   */
  public async checkProjectAdminPermissions(
    permission: ProjectAdminPermission,
    properties: Record<string, any>,
    expireMinutes = 10
  ) {
    try {
      const { pageContext } = this.spfxContext
      if (!pageContext) return false
      const storageKey = this.getStorageKey('getProjectAdminPermissions')
      const storageExpire = dateAdd(new Date(), 'minute', expireMinutes)
      const permissions = await new PnPClientStorage().session.getOrPut(
        storageKey,
        async () => {
          const userPermissions = []
          const rolesToCheck = properties.GtProjectAdminRoles
          if (!_.isArray(rolesToCheck) || _.isEmpty(rolesToCheck)) {
            const currentUserHasManageWebPermisson = await this.sp.web.currentUserHasPermissions(
              PermissionKind.ManageWeb
            )
            if (currentUserHasManageWebPermisson) return true
          }
          const currentUser = await this.getCurrentUser(pageContext.user)
          const projectAdminRoles = (await this.portal.getProjectAdminRoles()).filter(
            (role) => rolesToCheck.indexOf(role.title) !== -1
          )
          for (let i = 0; i < projectAdminRoles.length; i++) {
            const role = projectAdminRoles[i]
            switch (role.type) {
              case ProjectAdminRoleType.SiteAdmin:
                {
                  const currentUserHasManageWebPermisson =
                    await this.sp.web.currentUserHasPermissions(PermissionKind.ManageWeb)
                  if (currentUserHasManageWebPermisson) userPermissions.push(...role.permissions)
                }
                break
              case ProjectAdminRoleType.ProjectProperty:
                {
                  const projectFieldValue = properties[role.projectFieldName]
                  if (
                    _.isArray(projectFieldValue) &&
                    projectFieldValue.indexOf(currentUser.Id) !== -1
                  )
                    userPermissions.push(...role.permissions)
                  if (projectFieldValue === currentUser?.Id)
                    userPermissions.push(...role.permissions)
                }
                break
              case ProjectAdminRoleType.SharePointGroup:
                {
                  let web: IWeb = null
                  switch (role.groupLevel) {
                    case 'Prosjekt':
                      web = this.sp.web
                      break
                    case 'Portefølje':
                      web = this.portal.web
                      break
                  }
                  try {
                    if (
                      (
                        await web.siteGroups
                          .getByName(role.groupName)
                          .users.filter(`Email eq '${currentUser.Email}'`)()
                      ).length > 0
                    )
                      userPermissions.push(...role.permissions)
                  } catch {}
                }
                break
            }
          }
          return _.unique(userPermissions, (p) => p)
        },
        storageExpire
      )
      if (typeof permissions === 'boolean') return permissions
      else return _.contains(permissions, permission.toString())
    } catch {
      return false
    }
  }
}

export { ISPDataAdapterBaseConfiguration }
