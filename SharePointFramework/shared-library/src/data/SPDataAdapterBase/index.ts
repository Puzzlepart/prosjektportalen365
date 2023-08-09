import { format, IPersonaSharedProps, ITag } from '@fluentui/react'
import { SPUser } from '@microsoft/sp-page-context'
import { dateAdd, IPnPClientStore, PnPClientStorage } from '@pnp/core'
import { SPFI } from '@pnp/sp'
import '@pnp/sp/presets/all'
import { IWeb, PermissionKind } from '@pnp/sp/presets/all'
import { SpEntityPortalService } from 'sp-entityportal-service'
import _ from 'underscore'
import { ProjectAdminRoleType } from '../../models'
import { PortalDataService } from '../../services/PortalDataService'
import { SPFxContext } from '../../types'
import { createSpfiInstance } from '../createSpfiInstance'
import { ISPDataAdapterBaseConfiguration } from './ISPDataAdapterBaseConfiguration'
import { ProjectAdminPermission } from './ProjectAdminPermission'

export class SPDataAdapterBase<T extends ISPDataAdapterBaseConfiguration> {
  /**
   * Settings for the data adapter
   */
  public settings: T

  /**
   * Portal data service instance
   */
  public portal: PortalDataService

  /**
   * Entity service instance
   */
  public entityService: SpEntityPortalService

  /**
   * SPFI instance
   */
  public sp: SPFI

  /**
   * Whether the data adapter is configured
   */
  public isConfigured: boolean = false

  /**
   * SPF context
   */
  public spfxContext: SPFxContext

  /**
   * Instance of `IPnPClientStore`
   */
  private _storage: IPnPClientStore

  /**
   * Storage keys definitions
   */
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
  public async configure(spfxContext: SPFxContext, settings: T) {
    this.spfxContext = spfxContext
    this.settings = settings
    this.sp = createSpfiInstance(spfxContext)
    this.portal = await new PortalDataService().configure({
      spfxContext
    })
    this.entityService = new SpEntityPortalService(spfxContext, {
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

  /**
   * Search for users using `sp.profiles.clientPeoplePickerSearchUser`.
   *
   * @param queryString Query string
   * @param selectedItems Selected items that should be excluded from the result
   * @param maximumEntitySuggestions Maximum entity suggestions
   */
  public async clientPeoplePickerSearchUser(
    queryString: string,
    selectedItems: any[],
    maximumEntitySuggestions = 50
  ): Promise<IPersonaSharedProps[]> {
    const profiles = await this.sp.profiles.clientPeoplePickerSearchUser({
      QueryString: queryString,
      MaximumEntitySuggestions: maximumEntitySuggestions,
      AllowEmailAddresses: true,
      PrincipalSource: 15,
      PrincipalType: 1
    })
    const items = profiles.map((profile) => ({
      text: profile.DisplayText,
      secondaryText: profile.EntityData.Email,
      tertiaryText: profile.EntityData.Title,
      optionalText: profile.EntityData.Department,
      imageUrl: `/_layouts/15/userphoto.aspx?AccountName=${profile.EntityData.Email}&size=L`,
      id: profile.Key
    }))
    return items.filter(({ secondaryText }) => !_.findWhere(selectedItems, { secondaryText }))
  }

  /**
   * Get terms from term set as `ITag[]`. The result is filtered by `filter` and `selectedItems`.
   * Specify `languageTag` to get terms in a specific language (default `nb-NO`).
   *
   * @param termSetId Term set ID
   * @param filter Filter string
   * @param selectedItems Selected items that should be excluded from the result
   * @param languageTag Language tag (default `nb-NO`)
   */
  public async getTerms(
    termSetId: string,
    filter: string,
    selectedItems: any[],
    languageTag = 'nb-NO'
  ): Promise<ITag[]> {
    const terms = await this.sp.termStore.sets.getById(termSetId).terms()
    const tags = terms.map<ITag>((term) => {
      const name = term.labels.find((label) => label.languageTag === languageTag).name
      return {
        key: term.id,
        name
      }
    })
    return tags
      .filter((tag) => tag.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
      .filter((tag) => !selectedItems.find((item) => item.name === tag.name))
  }
}

export { ISPDataAdapterBaseConfiguration }
