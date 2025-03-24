import { format, IPersonaSharedProps, ITag } from '@fluentui/react'
import { SPUser } from '@microsoft/sp-page-context'
import { IPnPClientStore, PnPClientStorage } from '@pnp/core'
import { SPFI } from '@pnp/sp'
import '@pnp/sp/presets/all'
import { IWeb, PermissionKind } from '@pnp/sp/presets/all'
import { SpEntityPortalService } from 'sp-entityportal-service'
import _ from 'underscore'
import { ItemFieldValue, ItemFieldValues, ProjectAdminRoleType, SPField } from '../../models'
import { PortalDataService } from '../../services/PortalDataService/PortalDataService'
import { SPFxContext } from '../../types'
import { DefaultCaching } from '../cache'
import { createSpfiInstance } from '../createSpfiInstance'
import {
  GetMappedProjectPropertiesOptions,
  ISPDataAdapterBaseConfiguration,
  ProjectAdminPermission,
  ProjectPropertiesMapType
} from './types'

export class SPDataAdapterBase<
  T extends ISPDataAdapterBaseConfiguration = ISPDataAdapterBaseConfiguration
> {
  /**
   * Settings for the data adapter
   */
  public settings: T

  /**
   * An instance of `PortalDataService`
   */
  public portalDataService: PortalDataService

  /**
   * An instance of `SpEntityPortalService`
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
   * Global settings from the portal
   */
  public globalSettings: Map<string, string>

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
    this.portalDataService = await new PortalDataService().configure({
      spfxContext
    })
    this.entityService = new SpEntityPortalService(spfxContext, {
      portalUrl: this.portalDataService.url,
      listName: 'Prosjekter',
      contentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
      identityFieldName: 'GtSiteId',
      urlFieldName: 'GtSiteUrl'
    })
    if (this.settings.siteId) {
      this._initStorage()
    }
    if (this.settings.loadGlobalSettings) {
      this.globalSettings = await this.portalDataService.getGlobalSettings()
    }
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
   * Check project admin permissions.
   *
   * @param permission Permission to check
   * @param properties Project properties
   */
  public async checkProjectAdminPermissions(
    permission: ProjectAdminPermission,
    properties: ItemFieldValues
  ) {
    try {
      const { pageContext } = this.spfxContext
      if (!pageContext) return false

      const permissions = await (async () => {
        const userPermissions = []
        const rolesToCheck = properties.get('GtProjectAdminRoles').value
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
              {
                try {
                  const currentUserHasManageWebPermisson =
                    await this.sp.web.currentUserHasPermissions(PermissionKind.ManageWeb)
                  if (currentUserHasManageWebPermisson) userPermissions.push(...role.permissions)
                } catch {}
              }
              break
            case ProjectAdminRoleType.ProjectProperty:
              {
                const projectFieldValue = properties.get(role.projectFieldName).value
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
                let web: IWeb = null
                switch (role.groupLevel) {
                  case 'Prosjekt':
                    web = this.sp.web
                    break
                  case 'Portefølje':
                    web = this.portalDataService.web
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
    const tags = terms
      .filter((term) => !term.isDeprecated)
      .map<ITag>((term) => {
        const label =
          term.labels.find((label) => label.languageTag === languageTag) ||
          term.labels.find((label) => label.languageTag === 'en-US')
        const name = label ? label.name : ''
        return {
          key: term.id,
          name
        }
      })
    return tags
      .filter((tag) => tag.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
      .filter((tag) => !selectedItems.find((item) => item.name === tag.name))
  }

  /**
   * Filters a list of fields to include only those with the `Gt` prefix,
   * those in a custom group, or those specified in the forcedFields array.
   *
   * @param fields Fields
   * @param customSiteFieldsGroupName Custom site fields group name
   * @param forcedFields Array of field names to include regardless of the `ShowInEditForm` attribute value
   *
   * @returns Fields to sync
   */
  private _getFieldsToSync(
    fields: SPField[],
    customSiteFieldsGroupName: string,
    forcedFields: string[]
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
          hideFromEditForm || hidden
        )
          return false
        return true
      })
    ]
    return fieldsToSync
  }

  /**
   * Get mapped project properties from `fieldValues` and `fieldValuesText`.
   *
   * Site users needs to be fetched from the source web, so that they can be ensured for the destination web.
   *
   * @param fieldValues - Field values for the properties item
   * @param options Options for the mapping process (default `{}`
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
        {
          sourceWeb = this.portalDataService.web
          destinationWeb = this.sp.web
        }
        break
      case ProjectPropertiesMapType.FromPortfolioToPortfolio:
        {
          sourceWeb = this.portalDataService.web
          destinationWeb = this.portalDataService.web
        }
        break
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
      const fieldsToSync = this._getFieldsToSync(fields, options.customSiteFieldsGroup, [
        'GtIsParentProject',
        'GtIsProgram',
        'GtCurrentVersion'
      ])
      return await fieldsToSync.reduce(async ($properties, field) => {
        const properties = await $properties
        const fieldValue = fieldValues.get<ItemFieldValue>(field.InternalName, {
          format: 'object',
          defaultValue: {}
        })
        switch (field.TypeAsString) {
          case 'TaxonomyFieldType':
          case 'TaxonomyFieldTypeMulti':
            {
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
                (await destinationWeb.ensureUser(user.LoginName))?.data?.Id ?? null
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
              const destinationUserIds = (
                await Promise.all(
                  users.map(({ LoginName }) => destinationWeb.ensureUser(LoginName))
                )
              ).map(({ data }) => data.Id)
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
          case 'Currency': {
            properties[field.InternalName] = fieldValues.get<number>(field.InternalName, {
              format: 'number',
              defaultValue: null
            })
          }
          case 'URL':
            properties[field.InternalName] = fieldValue.value ?? null
            break
          case 'Boolean':
            properties[field.InternalName] = fieldValue.value ?? null
            break
          case 'MultiChoice':
            {
              if (fieldValue.value) {
                properties[field.InternalName] = options.wrapMultiValuesInResultsArray
                  ? { results: fieldValue.value }
                  : fieldValue.value
              }
            }
            break
          default:
            properties[field.InternalName] = fieldValue.valueAsText ?? null
            break
        }
        return properties
      }, Promise.resolve({}))
    } catch (error) {
      throw error
    }
  }
}

export * from './types'
