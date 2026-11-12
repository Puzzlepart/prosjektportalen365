import { SPUser } from '@microsoft/sp-page-context'
import { IPnPClientStore, PnPClientStorage } from '@pnp/core'
import { SPFI } from '@pnp/sp'
import '@pnp/sp/presets/all'
import { IWeb, PermissionKind } from '@pnp/sp/presets/all'
import _ from 'underscore'
import { ItemFieldValue, ItemFieldValues, ProjectAdminRoleType, SPField } from '../../models'
import { SpEntityPortalService } from '../../services/EntityPortalService'
import { PortalDataService } from '../../services/PortalDataService/PortalDataService'
import { getTermLabel, getTermStore } from '../../taxonomy'
import { SPFxContext } from '../../types'
import { IPersonaItem, ITagItem } from '../../types'
import { DefaultCaching } from '../cache'
import { createSpfiInstance } from '../createSpfiInstance'
import {
  GetMappedProjectPropertiesOptions,
  ISPDataAdapterBaseConfiguration,
  ProjectAdminPermission,
  ProjectPropertiesMapType
} from './types'
import resource from 'SharedResources'
import { format } from '../../util'

/**
 * Provides shared SharePoint clients, permissions and project-field mapping.
 */
export class SPDataAdapterBase<
  T extends ISPDataAdapterBaseConfiguration = ISPDataAdapterBaseConfiguration
> {
  public settings: T

  public portalDataService: PortalDataService

  public entityService: SpEntityPortalService

  public sp: SPFI

  public isConfigured: boolean = false

  public spfxContext: SPFxContext

  private _storage: IPnPClientStore

  private _storageKeys: Record<string, string> = {
    getProjectAdminPermissions: '{0}_project_admin_permissions'
  }

  /**
   * Global settings from the portal. Empty when they are not loaded (`loadGlobalSettings`) or the
   * hub is out of reach, so a setting reads as unset rather than throwing.
   */
  public globalSettings: Map<string, string> = new Map()

  /**
   * Initialize storage
   */
  private _initStorage() {
    this._storage = new PnPClientStorage().session
    this._storageKeys = Object.keys(this._storageKeys).reduce((obj, key) => {
      obj[key] = format(this._storageKeys[key], this.settings.siteId.replace(/-/g, ''))
      return obj
    }, {})
    void this._storage.deleteExpired()
  }

  /**
   * Get storage key for function
   */
  public getStorageKey(func: string) {
    return this._storageKeys[func]
  }

  /**
   * Configure the SP data adapter with the given SPFx context
   * and settings.
   *
   * @returns The configured SP data adapter
   */
  public async configure(spfxContext: SPFxContext, settings: T) {
    this.spfxContext = spfxContext
    this.settings = settings
    this.sp = createSpfiInstance(spfxContext)
    this.portalDataService = await new PortalDataService().configure({
      spfxContext
    })
    if (this.settings.siteId) {
      this._initStorage()
    }
    if (this.settings.loadGlobalSettings && this.portalDataService.isAvailable) {
      this.globalSettings = await this.portalDataService.getGlobalSettings()
    }
    if (this.portalDataService.isAvailable) {
      this.entityService = new SpEntityPortalService(spfxContext, {
        portalUrl: this.portalDataService.url,
        listName: resource.Lists_Projects_Title,
        contentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
        identityFieldName: 'GtSiteId',
        urlFieldName: 'GtSiteUrl'
      })
    }
    this.isConfigured = true
  }

  /**
   * Ensure current user and return it.
   */
  private async getCurrentUser(user: SPUser) {
    try {
      const currentUser = await this.sp.web.ensureUser(user.loginName ?? user.email)
      return currentUser
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        `(SPDataAdapterBase) (getCurrentUser) ensureUser failed for ${
          user?.loginName ?? user?.email ?? '<unknown>'
        }:`,
        error
      )
      return null
    }
  }

  /**
   * Check project admin permissions.
   *
   * @param properties Project properties (if not provided, tries to load from the project properties list)
   */
  public async checkProjectAdminPermissions(
    permission: ProjectAdminPermission,
    properties?: ItemFieldValues
  ) {
    try {
      const { pageContext } = this.spfxContext
      if (!pageContext) return false
      if (!this.portalDataService?.isAvailable) {
        return await this.sp.web.currentUserHasPermissions(PermissionKind.ManageWeb)
      }

      // The properties given, or the project's own; the parameter is never reassigned across
      // the awaits below.
      const projectProperties =
        properties ??
        (await (async () => {
          const propertiesList = this.sp.web.lists.getByTitle(
            resource.Lists_ProjectProperties_Title
          )
          const [propertiesItem] = await propertiesList.items.top(1)()
          return propertiesItem ? new ItemFieldValues(propertiesItem) : undefined
        })())
      if (!projectProperties) return false

      const permissions = await (async () => {
        const userPermissions = []
        // A field the item does not have reads as no value, not as an error that would deny
        // the permissions the other roles give.
        const rolesToCheck: string[] = projectProperties.get('GtProjectAdminRoles')?.value ?? []
        if (!_.isArray(rolesToCheck) || _.isEmpty(rolesToCheck)) {
          const currentUserHasManageWebPermisson = await this.sp.web.currentUserHasPermissions(
            PermissionKind.ManageWeb
          )
          if (currentUserHasManageWebPermisson) return true
        }
        const currentUser = await this.getCurrentUser(pageContext.user)
        const projectAdminRoles = (await this.portalDataService.getProjectAdminRoles()).filter(
          (role) => rolesToCheck.indexOf(role.title) !== -1
        )
        for (let i = 0; i < projectAdminRoles.length; i++) {
          const role = projectAdminRoles[i]
          switch (role.type) {
            case ProjectAdminRoleType.SiteAdmin:
              try {
                const currentUserHasManageWebPermisson =
                  await this.sp.web.currentUserHasPermissions(PermissionKind.ManageWeb)
                if (currentUserHasManageWebPermisson) userPermissions.push(...role.permissions)
              } catch (error) {
                // eslint-disable-next-line no-console
                console.warn(
                  '(SPDataAdapterBase) (checkProjectAdminPermissions) SiteAdmin permission check failed:',
                  error
                )
              }
              break
            case ProjectAdminRoleType.ProjectProperty:
              {
                if (!currentUser) break
                const projectFieldValue = projectProperties.get(role.projectFieldName)?.value
                if (
                  _.isArray(projectFieldValue) &&
                  projectFieldValue.indexOf(currentUser.Id) !== -1
                )
                  userPermissions.push(...role.permissions)
                if (projectFieldValue === currentUser?.Id) userPermissions.push(...role.permissions)
              }
              break
            case ProjectAdminRoleType.SharePointGroup:
              {
                if (!currentUser?.Email) break
                let web: IWeb = null
                switch (role.groupLevel) {
                  case resource.Lists_ProjectAdminRoles_GroupLevel_Project:
                    web = this.sp.web
                    break
                  case resource.Lists_ProjectAdminRoles_GroupLevel_Portfolio:
                    web = this.portalDataService?.web
                    break
                }
                if (!web) break
                try {
                  if (
                    (
                      await web.siteGroups
                        .getByName(role.groupName)
                        .users.filter(`Email eq '${currentUser.Email}'`)()
                    ).length > 0
                  )
                    userPermissions.push(...role.permissions)
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.warn(
                    `(SPDataAdapterBase) (checkProjectAdminPermissions) SharePointGroup membership check failed for group '${role.groupName}':`,
                    error
                  )
                }
              }
              break
          }
        }
        return _.unique(userPermissions)
      })()
      if (typeof permissions === 'boolean') return permissions
      else return _.contains(permissions, permission.toString())
    } catch {
      return false
    }
  }

  /**
   * Search for users using `sp.profiles.clientPeoplePickerSearchUser`.
   *
   * @param selectedItems Selected items that should be excluded from the result
   */
  public async clientPeoplePickerSearchUser(
    queryString: string,
    selectedItems: any[],
    maximumEntitySuggestions = 50
  ): Promise<IPersonaItem[]> {
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
   * Get terms from term set as `ITagItem[]`. The result is filtered by `filter` and `selectedItems`.
   * Specify `languageTag` to get terms in a specific language (default `nb-NO`). Labels are
   * resolved with `getTermLabel`, so a term without a label in that language falls back to
   * `nb-NO`, then `en-US`, then its first label.
   *
   * Reads the SharePoint term store through the shared taxonomy client, which follows server
   * paging so term sets larger than one page are returned in full.
   *
   * @param selectedItems Selected items that should be excluded from the result
   * @param languageTag Language tag (default `nb-NO`)
   */
  public async getTerms(
    termSetId: string,
    filter: string,
    selectedItems: any[],
    languageTag = 'nb-NO'
  ): Promise<ITagItem[]> {
    const terms = await getTermStore(this.sp.web).sets.getById(termSetId).terms.all()
    const tags = terms
      .filter((term) => !term.isDeprecated)
      .map<ITagItem>((term) => ({
        key: term.id,
        name: getTermLabel(term, languageTag)
      }))
    return tags
      .filter((tag) => tag.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
      .filter((tag) => !selectedItems.find((item) => item.name === tag.name))
  }

  /**
   * Selects visible editable project fields, always including title and child projects.
   *
   * @param forcedFields Extra field names eligible for selection; hidden and non-editable fields remain excluded.
   *
   * @returns Fields to sync
   */
  private _getFieldsToSync(
    fields: SPField[],
    customSiteFieldsGroupName: string,
    forcedFields: string[],
    projectDataSync?: boolean
  ): SPField[] {
    const fieldsToSync = [
      {
        InternalName: 'Title',
        TypeAsString: 'Text'
      } as SPField,
      {
        InternalName: 'GtChildProjects',
        TypeAsString: 'Note'
      } as SPField,
      ...fields.filter(({ SchemaXml, InternalName, Group }) => {
        const hideFromEditForm = SchemaXml.indexOf('ShowInEditForm="FALSE"') !== -1
        const hidden = SchemaXml.indexOf('Hidden="TRUE"') !== -1
        const gtPrefix = InternalName.indexOf('Gt') === 0
        const inCustomGroup = Group === customSiteFieldsGroupName
        if (
          (!gtPrefix && !inCustomGroup && !forcedFields.includes(InternalName)) ||
          hideFromEditForm ||
          hidden
        )
          return false
        return true
      })
    ]

    if (projectDataSync) {
      fieldsToSync.push({
        InternalName: 'GtParentProjects',
        TypeAsString: 'Note'
      } as SPField)
    }

    return fieldsToSync
  }

  /**
   * Maps project field values to the destination web's update payload.
   *
   * Source users are resolved and ensured on the destination web before their IDs are written.
   *
   * @param options Controls mapping direction, field selection and taxonomy serialization.
   *
   * @returns Mapped project properties for the destination web (default `{}`)
   */
  public async getMappedProjectProperties(
    fieldValues: ItemFieldValues,
    options: GetMappedProjectPropertiesOptions = {}
  ): Promise<Record<string, any>> {
    let sourceWeb: IWeb = this.sp.web
    let destinationWeb: IWeb = this.portalDataService.web
    switch (options.mapType) {
      case ProjectPropertiesMapType.FromPortfolioToProject:
        sourceWeb = this.portalDataService.web
        destinationWeb = this.sp.web
        break
      case ProjectPropertiesMapType.FromPortfolioToPortfolio:
        sourceWeb = this.portalDataService.web
        destinationWeb = this.portalDataService.web
        break
    }

    if (!this.entityService) {
      throw new Error(
        '(SPDataAdapterBase) (getMappedProjectProperties) entityService is not initialized — portal is unavailable.'
      )
    }
    try {
      const [fields, siteUsers, targetListFields] = await Promise.all([
        options.projectContentTypeId
          ? (this.entityService
              .usingParams({ contentTypeId: options.projectContentTypeId })
              .getEntityFields() as Promise<SPField[]>)
          : (this.entityService.getEntityFields() as Promise<SPField[]>),
        sourceWeb.siteUsers.select('Id', 'Email', 'LoginName', 'Title').using(DefaultCaching)(),
        options.targetListName
          ? destinationWeb.lists.getByTitle(options?.targetListName).fields.using(DefaultCaching)<
              SPField[]
            >()
          : Promise.resolve<SPField[]>([])
      ])
      const forcedFields = ['GtIsParentProject', 'GtIsProgram', 'GtCurrentVersion']
      const fieldsToSync = this._getFieldsToSync(
        fields,
        options.customSiteFieldsGroup,
        forcedFields,
        options.projectDataSync
      )
      return await fieldsToSync.reduce(async ($properties, field) => {
        const properties = await $properties
        const fieldValue = fieldValues.get<ItemFieldValue>(field.InternalName, {
          format: 'object',
          defaultValue: {}
        })
        switch (field.TypeAsString) {
          case 'TaxonomyFieldType':
          case 'TaxonomyFieldTypeMulti':
            if (options.useSharePointTaxonomyHiddenFields) {
              const textField = targetListFields.find((f) => f.Id === field.TextField)
              if (!textField) return properties
              properties[textField.InternalName] = fieldValues.get<string>(field.InternalName, {
                format: 'term_text'
              })
            } else {
              const [textField] = fields.filter(
                (f) => f.InternalName === `${field.InternalName}Text`
              )
              if (!textField) return properties
              properties[textField.InternalName] = fieldValue.valueAsText
            }
            break
          case 'User':
            {
              const userFieldName = `${field.InternalName}Id`
              const sourceUserId = fieldValues.get<number>(userFieldName, {
                format: 'user_id'
              })
              if (sourceWeb.toUrl() === destinationWeb.toUrl()) {
                properties[userFieldName] = sourceUserId
                return properties
              }
              const user = siteUsers.find((u) => u.Id === sourceUserId)
              if (!user) {
                properties[userFieldName] = null
                return properties
              }
              const destinationUserId =
                (await destinationWeb.ensureUser(user.LoginName))?.Id ?? null
              properties[userFieldName] = destinationUserId
            }
            break
          case 'UserMulti':
            {
              const userFieldName = `${field.InternalName}Id`
              const sourceUserIds = fieldValues.get<number[]>(userFieldName, {
                format: 'user_id',
                defaultValue: []
              })
              if (sourceWeb.toUrl() === destinationWeb.toUrl()) {
                properties[userFieldName] = sourceUserIds
                return properties
              }
              const users = siteUsers.filter(({ Id }) => sourceUserIds.indexOf(Id) !== -1)
              const ensureResults = await Promise.allSettled(
                users.map(({ LoginName }) => destinationWeb.ensureUser(LoginName))
              )
              const destinationUserIds = ensureResults.flatMap((r) =>
                r.status === 'fulfilled' && r.value?.Id ? [r.value.Id] : []
              )
              properties[userFieldName] = options.wrapMultiValuesInResultsArray
                ? { results: destinationUserIds }
                : destinationUserIds
            }
            break
          case 'Date':
          case 'DateTime':
            properties[field.InternalName] = fieldValues.get<Date>(field.InternalName, {
              format: 'date',
              defaultValue: null
            })
            break
          case 'Number':
          case 'Currency':
            properties[field.InternalName] = fieldValues.get<number>(field.InternalName, {
              format: 'number',
              defaultValue: null
            })
            break
          case 'URL':
            properties[field.InternalName] = fieldValue.value ?? null
            break
          case 'Boolean':
            properties[field.InternalName] = fieldValue.value ?? null
            break
          case 'MultiChoice':
            if (fieldValue.value) {
              properties[field.InternalName] = options.wrapMultiValuesInResultsArray
                ? { results: fieldValue.value }
                : fieldValue.value
            }
            break
          default:
            properties[field.InternalName] = fieldValue.valueAsText ?? null
            break
        }
        return properties
      }, Promise.resolve({}))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        '(SPDataAdapterBase) (getMappedProjectProperties) Failed to map project properties:',
        error
      )
      throw error
    }
  }
}

export * from './types'
