import { WebPartContext } from '@microsoft/sp-webpart-base'
import { TypedHash } from '@pnp/common'
import { Logger, LogLevel } from '@pnp/logging'
import { taxonomy } from '@pnp/sp-taxonomy'
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator'
import { SPDataAdapterBase } from 'pp365-shared/lib/data'
import { ProjectDataService } from 'pp365-shared/lib/services'
import * as strings from 'ProjectWebPartsStrings'
import { IEntityField } from 'sp-entityportal-service/types'
import { find } from 'underscore'
import { ISPDataAdapterConfiguration } from './ISPDataAdapterConfiguration'

class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
  public project: ProjectDataService
  private _name = 'SPDataAdapter'

  /**
   * Configure the SP data adapter
   *
   * @param {WebPartContext} spfxContext Context
   * @param {ISPDataAdapterConfiguration} settings Settings
   */
  public configure(spfxContext: WebPartContext, configuration: ISPDataAdapterConfiguration) {
    super.configure(spfxContext, configuration)
    taxonomy.setup({ spfxContext })
    this.project = new ProjectDataService({
      ...this.settings,
      entityService: this.entityService,
      propertiesListName: strings.ProjectPropertiesListName,
      sp: this.sp,
      taxonomy
    })
    this.project.spConfiguration = this.spConfiguration
  }

  /**
   * Get fields to sync
   * 
   * @param fields - Fields
   * @param customGroupName - Custom group name
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
   * @param {TypedHash} fieldValues - Field values for the properties item
   * @param {TypedHash} fieldValuesText - Field values in text format for the properties item
   * @param {TypedHash<any>} templateParameters - Template parameters
   * @param {void} progressFunc - Progress function
   */
  public async syncPropertyItemToHub(
    fieldValues: TypedHash<any>,
    fieldValuesText: TypedHash<string>,
    templateParameters: TypedHash<any>,
    progressFunc: (props: IProgressIndicatorProps) => void
  ): Promise<void> {
    try {
      fieldValuesText = Object.keys(fieldValuesText).reduce(
        (obj, key) => ({ ...obj, [key.replace(/_x005f_/gm, '_')]: fieldValuesText[key] }),
        {}
      )
      progressFunc({
        label: strings.SyncProjectPropertiesValuesProgressDescription,
        description: strings.SyncProjectPropertiesValuesProgressDescription
      })
      const [fields, siteUsers] = await Promise.all([
        templateParameters.ProjectContentTypeId
          ? this.entityService
            .usingParams({ contentTypeId: templateParameters.ProjectContentTypeId })
            .getEntityFields()
          : this.entityService.getEntityFields(),
        this.sp.web.siteUsers
          .select('Id', 'Email', 'LoginName')
          .get<{
            Id: number;
            Email: string;
            LoginName: string
          }[]>()
      ])
      const fieldsToSync = this._getFieldsToSync(fields, templateParameters.CustomSiteFields)
      const properties: TypedHash<any> = {}
      for (let i = 0; i < fieldsToSync.length; i++) {
        const fld = fieldsToSync[i]
        const fldValue = fieldValues[fld.InternalName]
        const fldValueTxt = fieldValuesText[fld.InternalName]
        switch (fld.TypeAsString) {
          case 'TaxonomyFieldType':
          case 'TaxonomyFieldTypeMulti':
            {
              let [textField] = fields.filter((f) => f.InternalName === `${fld.InternalName}Text`)
              if (textField) properties[textField.InternalName] = fieldValuesText[fld.InternalName]
              else {
                textField = find(fields, (f) => f.Id === fld.TextField)
                if (!textField) continue
                properties[textField.InternalName] = fieldValuesText[textField.InternalName]
              }
            }
            break
          case 'User':
            {
              const [_user] = siteUsers.filter((u) => u.Id === fieldValues[`${fld.InternalName}Id`])
              const user = _user ? await this.entityService.web.ensureUser(_user.LoginName) : null
              properties[`${fld.InternalName}Id`] = user ? user.data.Id : null
            }
            break
          case 'UserMulti':
            {
              const userIds = fieldValues[`${fld.InternalName}Id`] || []
              const users = siteUsers.filter((u) => userIds.indexOf(u.Id) !== -1)
              const ensured = await Promise.all(
                users.map(({ LoginName }) => this.entityService.web.ensureUser(LoginName))
              )
              properties[`${fld.InternalName}Id`] = { results: ensured.map(({ data }) => data.Id) }
            }
            break
          case 'DateTime':
            {
              properties[fld.InternalName] = fldValue ? new Date(fldValue) : null
            }
            break
          case 'Currency':
          case 'URL':
            {
              properties[fld.InternalName] = fldValue || null
            }
            break
          default:
            {
              properties[fld.InternalName] = fldValueTxt || null
            }
            break
        }
      }
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
   * Fetch term field context
   *
   * @param {string} fieldName Field name for phase
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
   * Clear cache
   */
  public clearCache() {
    this.project.clearCache()
  }
}

export default new SPDataAdapter()
