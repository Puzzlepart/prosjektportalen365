import { IProgressIndicatorProps } from '@fluentui/react/lib/ProgressIndicator'
import { LogLevel, Logger } from '@pnp/logging'
import * as strings from 'ProjectWebPartsStrings'
import { DefaultCaching, SPDataAdapterBase } from 'pp365-shared-library/lib/data'
import { ProjectDataService } from 'pp365-shared-library/lib/services'
import { SPFxContext } from 'pp365-shared-library/lib/types'
import { IEntityField } from 'sp-entityportal-service/types'
import { IConfigurationFile } from 'types'
import _ from 'underscore'
import { ISPDataAdapterConfiguration } from './types'
import { ItemFieldValues, ItemFieldValue } from 'pp365-shared-library'

class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
  public project: ProjectDataService
  private _name = 'SPDataAdapter'

  /**
   * Configure the SP data adapter
   *
   * @param spfxContext SPFx context
   * @param configuration Configuration
   */
  public async configure(
    spfxContext: SPFxContext,
    configuration: ISPDataAdapterConfiguration
  ): Promise<void> {
    await super.configure(spfxContext, configuration)
    this.project = new ProjectDataService({
      ...this.settings,
      spfxContext,
      entityService: this.entityService,
      propertiesListName: strings.ProjectPropertiesListName
    })
  }

  /**
   * Filters a list of fields to include only those with the `Gt` prefix,
   * those in a custom group, or those specified in the forcedFields array.
   *
   * @param fields Fields
   * @param customGroupName Custom group name
   * @param forcedFields Array of field names to include regardless of the `ShowInEditForm` attribute value
   *
   * @returns Fields to sync
   */
  private _getFieldsToSync(
    fields: IEntityField[],
    customGroupName: string,
    forcedFields: string[]
  ) {
    const fieldsToSync = [
      {
        InternalName: 'Title',
        TypeAsString: 'Text'
      },
      {
        InternalName: 'GtChildProjects',
        TypeAsString: 'Note'
      },
      ...fields.filter(({ SchemaXml, InternalName, Group }) => {
        const hideFromEditForm = SchemaXml.indexOf('ShowInEditForm="FALSE"') !== -1
        const gtPrefix = InternalName.indexOf('Gt') === 0
        const inCustomGroup = Group === customGroupName
        if (
          (!gtPrefix && !inCustomGroup && !forcedFields.includes(InternalName)) ||
          hideFromEditForm
        )
          return false
        return true
      })
    ]
    return fieldsToSync
  }

  /**
   * Sync property item from site to associated hub. `this.getMappedProjectProperties` is used to
   * map the properties item fields to the hub fields. `updateEntityItem` from `sp-entityportal-service`
   * is used to update the hub entity item. If any errors occur, the original error is passed to the caller.
   *
   * @param title Title of the project
   * @param fieldValues Field values for the properties item
   * @param templateParameters Template parameters
   * @param progressFunc Progress function
   */
  public async syncPropertyItemToHub(
    title: string,
    fieldValues: ItemFieldValues,
    templateParameters: Record<string, any>,
    progressFunc: (props: IProgressIndicatorProps) => void
  ): Promise<void> {
    try {
      progressFunc({
        label: strings.SyncProjectPropertiesValuesProgressLabel,
        description: strings.SyncProjectPropertiesValuesProgressDescription
      })
      const properties = await this.getMappedProjectProperties(fieldValues, templateParameters)
      await this.entityService.updateEntityItem(this.settings.siteId, {
        ...properties,
        Title: title
      })
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
   * Get mapped project properties from `fieldValues` and `fieldValuesText`, using
   * `templateParameters` to determine which fields to include.
   *
   * @param fieldValues - Field values for the properties item
   * @param templateParameters - Template parameters
   * @param syncToProject - Whether to sync to the project
   * @param wrapMultiValuesInResultsArray - Whether to wrap multi-values in results array (default: false)
   */
  public async getMappedProjectProperties(
    fieldValues: ItemFieldValues,
    templateParameters: Record<string, any>,
    syncToProject: boolean = false,
    wrapMultiValuesInResultsArray: boolean = false
  ): Promise<Record<string, any>> {
    try {
      const [fields, siteUsers] = await Promise.all([
        templateParameters?.ProjectContentTypeId
          ? this.entityService
              .usingParams({ contentTypeId: templateParameters.ProjectContentTypeId })
              .getEntityFields()
          : this.entityService.getEntityFields(),
        this.sp.web.siteUsers.select('Id', 'Email', 'LoginName', 'Title')()
      ])
      const fieldsToSync = this._getFieldsToSync(fields, templateParameters?.CustomSiteFields, [
        'GtIsParentProject',
        'GtIsProgram',
        'GtCurrentVersion'
      ])
      const properties: Record<string, any> = {}
      for (let i = 0; i < fieldsToSync.length; i++) {
        const field = fieldsToSync[i]
        const fieldValue = fieldValues.get<ItemFieldValue>(field.InternalName, { asObject: true })
        switch (field.TypeAsString) {
          case 'TaxonomyFieldType':
            {
              if (syncToProject && fieldValue.valueAsText !== '') {
                const term = { ...fieldValue.value, WssId: -1, Label: fieldValue.valueAsText }
                properties[field.InternalName] = term ?? null
              } else {
                let [textField] = fields.filter(
                  (f) => f.InternalName === `${field.InternalName}Text`
                )
                if (textField) properties[textField.InternalName] = fieldValue.valueAsText
                else {
                  textField = _.find(fields, (f) => f.Id === field.TextField)
                  if (!textField) continue
                  properties[textField.InternalName] = fieldValues.get<string>(
                    textField.InternalName,
                    { asText: true }
                  )
                }
              }
            }
            break
          case 'TaxonomyFieldTypeMulti':
            {
              if (syncToProject && fieldValue.valueAsText !== '') {
                // TODO: Fix this and make it work
                // const terms = fldValue.map((t) => ({
                //   ...t,
                //   WssId: -1,
                //   Label: t.Label
                // }))
                // let termsString: string = '';
                // terms.forEach(term => {
                //   termsString += `-1;#${term.Label}|${term.TermGuid};#`;
                // })
                // properties[fld.InternalName] = termsString ?? null
              } else {
                let [textField] = fields.filter(
                  (f) => f.InternalName === `${field.InternalName}Text`
                )
                if (textField) properties[textField.InternalName] = fieldValue.valueAsText
                else {
                  textField = _.find(fields, (f) => f.Id === field.TextField)
                  if (!textField) continue
                  properties[textField.InternalName] = fieldValues.get<string>(
                    textField.InternalName,
                    { asText: true }
                  )
                }
              }
            }
            break
          case 'User':
            {
              if (syncToProject) {
                const [_user] = siteUsers.filter((u) => u.Title === fieldValue.valueAsText)
                const user = _user ? await this.sp.web.ensureUser(_user.LoginName) : null
                properties[`${field.InternalName}Id`] = user ? user.data.Id : null
              } else {
                const [_user] = siteUsers.filter(
                  (u) => u.Id === fieldValues[`${field.InternalName}Id`]
                )
                const user = _user ? await this.entityService.web.ensureUser(_user.LoginName) : null
                properties[`${field.InternalName}Id`] = user ? user.data.Id : null
              }
            }
            break
          case 'UserMulti':
            {
              if (syncToProject) {
                const userIds = fieldValue.valueAsText || []
                const users = siteUsers.filter((u) => userIds.indexOf(u.Title) !== -1)
                const ensured = await Promise.all(
                  users.map(({ LoginName }) => this.sp.web.ensureUser(LoginName))
                )
                properties[`${field.InternalName}Id`] = {
                  results: ensured.map(({ data }) => data.Id)
                }
              } else {
                const userIds = fieldValues[`${field.InternalName}Id`] || []
                const users = siteUsers.filter((u) => userIds.indexOf(u.Id) !== -1)
                const ensured = (
                  await Promise.all(
                    users.map(({ LoginName }) => this.entityService.web.ensureUser(LoginName))
                  )
                ).map(({ data }) => data.Id)
                properties[`${field.InternalName}Id`] = wrapMultiValuesInResultsArray
                  ? { results: ensured }
                  : ensured
              }
            }
            break
          case 'DateTime':
            properties[field.InternalName] = fieldValue.value ? new Date(fieldValue.value) : null
            break
          case 'Number':
          case 'Currency': {
            properties[field.InternalName] = fieldValue.value ? parseFloat(fieldValue.value) : null
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
                properties[field.InternalName] = wrapMultiValuesInResultsArray
                  ? { results: fieldValue.value }
                  : fieldValue.value
              }
            }
            break
          default:
            properties[field.InternalName] = fieldValue.valueAsText ?? null
            break
        }
      }

      return properties
    } catch (error) {
      throw error
    }
  }

  /**
   * Fetch term field context. Fetches the `InternalName` and `TermSetId` for the field,
   * aswell as the `InternalName` for the text field.
   *
   * @param fieldName Field name for phase
   */
  public async getTermFieldContext(fieldName: string) {
    const field = await this.sp.web.fields
      .getByInternalNameOrTitle(fieldName)
      .select('InternalName', 'TermSetId', 'TextField')
      .using(DefaultCaching)<{
      InternalName: string
      TermSetId: string
      TextField: string
    }>()
    const textField = await this.sp.web.fields
      .getById(field.TextField)
      .select('InternalName')
      .using(DefaultCaching)<{ InternalName: string }>()
    return {
      fieldName: field.InternalName,
      termSetId: field.TermSetId,
      textField: textField.InternalName
    } as const
  }

  /**
   * Clear cache for the project.
   */
  public clearCache() {
    this.project.clearCache()
  }

  /**
   * Get configuration files from the specified folder `folderPath` relative to
   * the configuration folder (`strings.SiteAssetsConfigurationFolder`) in Site Assets.
   *
   * @param folderPath Folder path relative to the configuration folder in Site Assets
   */
  public async getConfigurations(folderPath: string): Promise<IConfigurationFile[]> {
    try {
      const { ServerRelativeUrl } = await this.portal.web.rootFolder
        .select('ServerRelativeUrl')
        .using(DefaultCaching)<{
        ServerRelativeUrl: string
      }>()
      const folderRelativeUrl = `${ServerRelativeUrl}/${strings.SiteAssetsConfigurationFolder}/${folderPath}`
      const folder = this.portal.web.getFolderByServerRelativePath(folderRelativeUrl)
      const files = await folder.files
        .select('Name', 'ServerRelativeUrl', 'ListItemAllFields/Title')
        .expand('ListItemAllFields')
        .using(DefaultCaching)()
      return files.map((file) => ({
        name: file.Name,
        title:
          _.get(file, 'ListItemAllFields.Title') ??
          `${strings.UnknownConfigurationName} (${file.Name})`,
        url: file.ServerRelativeUrl
      }))
    } catch {
      return []
    }
  }
}

export default new SPDataAdapter()
