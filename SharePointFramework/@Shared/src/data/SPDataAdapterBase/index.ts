import '@pnp/polyfill-ie11'
import { sp, SPConfiguration, SPRest, Web } from '@pnp/sp'
import { SpEntityPortalService } from 'sp-entityportal-service'
import { PortalDataService } from '../../services/PortalDataService'
import { ISPDataAdapterBaseConfiguration } from './ISPDataAdapterBaseConfiguration'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { ProjectAdminRoleType } from '../../models'
import { ProjectAdminPermission } from './ProjectAdminPermission'
import { dateAdd, PnPClientStorage, PnPClientStore } from '@pnp/common'
import { isArray, unique, contains } from 'underscore'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import { SPUser } from '@microsoft/sp-page-context'

export class SPDataAdapterBase<T extends ISPDataAdapterBaseConfiguration> {
  public spConfiguration: SPConfiguration = {
    defaultCachingStore: 'session',
    defaultCachingTimeoutSeconds: 90,
    enableCacheExpiration: true,
    cacheExpirationIntervalMilliseconds: 2500,
    globalCacheDisable: false
  }
  public settings: T
  public portal: PortalDataService
  public entityService: SpEntityPortalService
  public sp: SPRest
  public isConfigured: boolean = false
  public spfxContext: ApplicationCustomizerContext | ListViewCommandSetContext | WebPartContext
  private _storage: PnPClientStore
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
  public configure(spfxContext: any, settings: T) {
    this.spfxContext = spfxContext
    this.settings = settings
    sp.setup({ spfxContext, ...this.spConfiguration })
    this.sp = sp
    this.portal = new PortalDataService().configure({
      urlOrWeb: new Web(this.settings.hubSiteUrl),
      siteId: this.settings.siteId
    })
    this.entityService = new SpEntityPortalService({
      portalUrl: this.settings.hubSiteUrl,
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
      const { data: currentUser } = await sp.web.ensureUser(user.loginName ?? user.email)
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
    const { pageContext } = this.spfxContext
    if (!pageContext) return false
    const storageKey = this.getStorageKey('getProjectAdminPermissions')
    const storageExpire = dateAdd(new Date(), 'minute', expireMinutes)
    const permissions = await new PnPClientStorage().session.getOrPut(
      storageKey,
      async () => {
        const userPermissions = []
        const rolesToCheck = properties.GtProjectAdminRoles
        if (!isArray(rolesToCheck)) {
          if (pageContext.legacyPageContext.isSiteAdmin === true) return true
          else return false
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
                if (pageContext.legacyPageContext.isSiteAdmin === true)
                  userPermissions.push(...role.permissions)
              }
              break
            case ProjectAdminRoleType.ProjectProperty:
              {
                const projectFieldValue = properties[role.projectFieldName]
                if (isArray(projectFieldValue) && projectFieldValue.indexOf(currentUser.Id) !== -1)
                  userPermissions.push(...role.permissions)
                if (projectFieldValue === currentUser?.Id) userPermissions.push(...role.permissions)
              }
              break
            case ProjectAdminRoleType.SharePointGroup:
              {
                let web: Web = null
                switch (role.groupLevel) {
                  case 'Prosjekt':
                    web = sp.web
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
                        .users.filter(`Email eq '${currentUser.Email}'`)
                        .get()
                    ).length > 0
                  )
                    userPermissions.push(...role.permissions)
                } catch {}
              }
              break
          }
        }
        return unique(userPermissions, (p) => p)
      },
      storageExpire
    )
    if (typeof permissions === 'boolean') return permissions
    else return contains(permissions, permission.toString())
  }
}

export { ISPDataAdapterBaseConfiguration }
