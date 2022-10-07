import { WebPartContext } from '@microsoft/sp-webpart-base'
import { dateAdd, PnPClientStorage, TypedHash } from '@pnp/common'
import { Logger, LogLevel } from '@pnp/logging'
import { sp, Web } from '@pnp/sp'
import { taxonomy } from '@pnp/sp-taxonomy'
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator'
import { SPDataAdapterBase } from 'pp365-shared/lib/data'
import { ProjectAdminRoleType } from 'pp365-shared/lib/models'
import { ProjectDataService } from 'pp365-shared/lib/services'
import * as strings from 'ProjectWebPartsStrings'
import { IEntityField } from 'sp-entityportal-service/types'
import { contains, find, isArray, unique } from 'underscore'
import { ISPDataAdapterConfiguration } from './ISPDataAdapterConfiguration'
import { ProjectAdminPermission } from './ProjectAdminPermission'

class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
  public project: ProjectDataService
  private _name = 'SPDataAdapter'

  /**
   * Configure the SP data adapter
   *
   * @param spfxContext Context
   * @param configuration Configuration
   */
  public configure(spfxContext: WebPartContext, configuration: ISPDataAdapterConfiguration) {
    super.configure(spfxContext, configuration)
    taxonomy.setup({ spfxContext })
    this.project = new ProjectDataService(
      {
        ...this.settings,
        entityService: this.entityService,
        propertiesListName: strings.ProjectPropertiesListName,
        taxonomy
      },
      this.spConfiguration
    )
  }

  /**
   * Get fields to sync
   *
   * @param fields Fields
   * @param customGroupName Custom group name
   *
   * @returns Fields to sync
   */
  private _getFieldsToSync(fields: IEntityField[], customGroupName: string): any[] {
    const fieldToSync = [
      {
        InternalName: 'Title',
        TypeAsString: 'Text',
        TextField: undefined
      },
      {
        InternalName: 'GtChildProjects',
        TypeAsString: 'Note',
        TextField: undefined
      },
      ...fields.filter(({ SchemaXml, InternalName, Group }) => {
        const hideFromEditForm = SchemaXml.indexOf('ShowInEditForm="FALSE"') !== -1
        const gtPrefix = InternalName.indexOf('Gt') === 0
        const inCustomGroup = Group === customGroupName
        if (hideFromEditForm) return false
        if (!gtPrefix && !inCustomGroup) return false
        return true
      })
    ]
    return fieldToSync
  }

  /**
   * Sync property item from site to associated hub
   *
   * @param fieldValues Field values for the properties item
   * @param fieldValuesText Field values in text format for the properties item
   * @param templateParameters Template parameters
   * @param progressFunc Progress function
   */
  public async syncPropertyItemToHub(
    fieldValues: TypedHash<any>,
    fieldValuesText: TypedHash<string>,
    templateParameters: TypedHash<any>,
    progressFunc: (props: IProgressIndicatorProps) => void
  ): Promise<void> {
    try {
      progressFunc({
        label: strings.SyncProjectPropertiesValuesProgressDescription,
        description: strings.SyncProjectPropertiesValuesProgressDescription
      })
      const properties = await this.getMappedProjectProperties(
        fieldValues,
        fieldValuesText,
        templateParameters
      )
      await this.entityService.updateEntityItem(this.settings.siteId, properties)
      Logger.log({
        message: `(${this._name}) (syncPropertyItemToHub) Successfully synced item to hub entity.`,
        data: { properties },
        level: LogLevel.Info
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Sync project data from associated hub to site's property item
   *
   * @param fieldValues - Field values for the properties item
   * @param fieldValuesText - Field values in text format for the properties item
   * @param templateParameters - Template parameters
   */
  public async getMappedProjectProperties(
    fieldValues: TypedHash<any>,
    fieldValuesText: TypedHash<string>,
    templateParameters: TypedHash<any>,
    syncToProject: boolean = false
  ): Promise<any> {
    try {
      fieldValuesText = Object.keys(fieldValuesText).reduce(
        (obj, key) => ({ ...obj, [key.replace(/_x005f_/gm, '_')]: fieldValuesText[key] }),
        {}
      )
      const [fields, siteUsers] = await Promise.all([
        templateParameters.ProjectContentTypeId
          ? this.entityService
            .usingParams({ contentTypeId: templateParameters.ProjectContentTypeId })
            .getEntityFields()
          : this.entityService.getEntityFields(),
        this.sp.web.siteUsers.select('Id', 'Email', 'LoginName', 'Title').get<
          {
            Id: number
            Email: string
            LoginName: string
            Title: string
          }[]
        >()
      ])
      const fieldsToSync = this._getFieldsToSync(fields, templateParameters.CustomSiteFields)
      const properties: TypedHash<any> = {}
      for (let i = 0; i < fieldsToSync.length; i++) {
        const fld = fieldsToSync[i]
        const fldValue = fieldValues[fld.InternalName]
        const fldValueTxt = fieldValuesText[fld.InternalName]
        switch (fld.TypeAsString) {
          case 'TaxonomyFieldType':
            {
              if (syncToProject) {
                const term = { ...fldValue, WssId: -1, Label: fldValueTxt }
                properties[fld.InternalName] = term || null
              } else {
                let [textField] = fields.filter((f) => f.InternalName === `${fld.InternalName}Text`)
                if (textField)
                  properties[textField.InternalName] = fieldValuesText[fld.InternalName]
                else {
                  textField = find(fields, (f) => f.Id === fld.TextField)
                  if (!textField) continue
                  properties[textField.InternalName] = fieldValuesText[textField.InternalName]
                }
              }
            }
            break
          case 'TaxonomyFieldTypeMulti':
            {
              if (syncToProject) {
                // TODO: See SyncProjectModal TODO
              } else {
                let [textField] = fields.filter((f) => f.InternalName === `${fld.InternalName}Text`)
                if (textField)
                  properties[textField.InternalName] = fieldValuesText[fld.InternalName]
                else {
                  textField = find(fields, (f) => f.Id === fld.TextField)
                  if (!textField) continue
                  properties[textField.InternalName] = fieldValuesText[textField.InternalName]
                }
              }
            }
            break
          case 'User':
            {
              if (syncToProject) {
                const [_user] = siteUsers.filter(
                  (u) => u.Title === fieldValuesText[fld.InternalName]
                )
                const user = _user ? await sp.web.ensureUser(_user.LoginName) : null
                properties[`${fld.InternalName}Id`] = user ? user.data.Id : null
              } else {
                const [_user] = siteUsers.filter(
                  (u) => u.Id === fieldValues[`${fld.InternalName}Id`]
                )
                const user = _user ? await this.entityService.web.ensureUser(_user.LoginName) : null
                properties[`${fld.InternalName}Id`] = user ? user.data.Id : null
              }
            }
            break
          case 'UserMulti':
            {
              if (syncToProject) {
                const userIds = fieldValuesText[fld.InternalName] || []
                const users = siteUsers.filter((u) => userIds.indexOf(u.Title) !== -1)
                const ensured = await Promise.all(
                  users.map(({ LoginName }) => sp.web.ensureUser(LoginName))
                )
                properties[`${fld.InternalName}Id`] = {
                  results: ensured.map(({ data }) => data.Id)
                }
              } else {
                const userIds = fieldValues[`${fld.InternalName}Id`] || []
                const users = siteUsers.filter((u) => userIds.indexOf(u.Id) !== -1)
                const ensured = await Promise.all(
                  users.map(({ LoginName }) => this.entityService.web.ensureUser(LoginName))
                )
                properties[`${fld.InternalName}Id`] = {
                  results: ensured.map(({ data }) => data.Id)
                }
              }
            }
            break
          case 'DateTime':
            {
              properties[fld.InternalName] = fldValue ? new Date(fldValue) : null
            }
            break
          case 'Number':
          case 'Currency': {
            properties[fld.InternalName] = fldValue ? parseFloat(fldValue) : null
          }
          case 'URL':
            {
              properties[fld.InternalName] = fldValue || null
            }
            break
          case 'Boolean':
            {
              properties[fld.InternalName] = fldValue || null
            }
            break
          case 'MultiChoice':
            {
              if (fldValue) {
                properties[fld.InternalName] = { results: fldValue }
              }
            }
            break
          default:
            {
              properties[fld.InternalName] = fldValueTxt || null
            }
            break
        }
      }

      return properties
    } catch (error) {
      throw error
    }
  }

  /**
   * Fetch term field context
   *
   * @param fieldName Field name for phase
   */
  public async getTermFieldContext(fieldName: string) {
    const phaseField = await this.sp.web.fields
      .getByInternalNameOrTitle(fieldName)
      .select('InternalName', 'TermSetId', 'TextField')
      .usingCaching()
      .get<{ InternalName: string; TermSetId: string; TextField: string }>()
    const phaseTextField = await this.sp.web.fields
      .getById(phaseField.TextField)
      .select('InternalName')
      .usingCaching()
      .get<{ InternalName: string }>()
    return {
      fieldName: phaseField.InternalName,
      termSetId: phaseField.TermSetId,
      phaseTextField: phaseTextField.InternalName
    }
  }

  /**
   * Get project admin permissions. The result is stored in `sessionStorage`
   * for 30 minutes to avoid too many requests.
   *
   * @param permission Permission to check
   * @param properties Project properties
   */
  public async getProjectAdminPermissions(
    permission: ProjectAdminPermission,
    properties: Record<string, any>
  ) {
    if (!this?.spfxContext?.pageContext) return false
    const storageKey = this.project.getStorageKey('getProjectAdminPermissions')
    const storageExpire = dateAdd(new Date(), 'minute', 30)
    const permissions = await new PnPClientStorage().session.getOrPut(
      storageKey,
      async () => {
        const userPermissions = []
        const rolesToCheck = properties.GtProjectAdminRoles
        if (!rolesToCheck) {
          if (this.spfxContext.pageContext.legacyPageContext.isSiteAdmin === true) return true
          else return false
        }
        const { data: currentUser } = await this.project.web.ensureUser(
          this.spfxContext.pageContext.user.email
        )
        const projectAdminRoles = (await this.portal.getProjectAdminRoles()).filter(
          (role) => rolesToCheck.indexOf(role.title) !== -1
        )
        for (let i = 0; i < projectAdminRoles.length; i++) {
          const role = projectAdminRoles[i]
          switch (role.type) {
            case ProjectAdminRoleType.SiteAdmin:
              {
                if (this.spfxContext.pageContext.legacyPageContext.isSiteAdmin === true)
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
                  case strings.GroupLevelProject:
                    web = this.project.web
                    break
                  case strings.GroupLevelPortfolio:
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
                } catch { }
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

  /**
   * Clear cache for the project.
   */
  public clearCache() {
    this.project.clearCache()
  }
}

export default new SPDataAdapter()
