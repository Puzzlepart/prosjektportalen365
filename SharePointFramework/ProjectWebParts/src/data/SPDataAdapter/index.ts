import { WebPartContext } from '@microsoft/sp-webpart-base'
import { TypedHash } from '@pnp/common'
import { Logger, LogLevel } from '@pnp/logging'
import { taxonomy } from '@pnp/sp-taxonomy'
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator'
import * as strings from 'ProjectWebPartsStrings'
import { SPDataAdapterBase } from 'shared/lib/data'
import { ProjectDataService } from 'shared/lib/services'
import { ISPDataAdapterConfiguration } from './ISPDataAdapterConfiguration'

export default new (class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
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
   * Sync property item from site to associated hub
   *
   * @param {TypedHash} fieldValues Field values for the properties item
   * @param {TypedHash} fieldValuesText Field values in text format for the properties item
   * @param {TypedHash<any>} templateParameters Template parameters
   * @param {void} progressFunc Progress function
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
      Logger.log({
        message: `(${this._name}) (syncPropertyItemToHub) Starting sync of property item to hub.`,
        level: LogLevel.Info
      })
      progressFunc({
        label: strings.SyncProjectPropertiesValuesProgressDescription,
        description: 'Vennligst vent...'
      })
      const [fields, siteUsers] = await Promise.all([
        templateParameters.ProjectContentTypeId
          ? this.entityService
              .usingParams({ contentTypeId: templateParameters.ProjectContentTypeId })
              .getEntityFields()
          : this.entityService.getEntityFields(),
        this.sp.web.siteUsers
          .select('Id', 'Email', 'LoginName')
          .get<{ Id: number; Email: string; LoginName: string }[]>()
      ])
      Logger.log({
        message: `(${this._name}) (syncPropertyItemToHub) Retreived ${fields.length} from entity.`,
        level: LogLevel.Info
      })
      const fieldToSync = [
        { InternalName: 'Title', TypeAsString: 'Text', TextField: undefined },
        ...fields.filter((fld) => {
          if (fld.SchemaXml.indexOf('ShowInEditForm="FALSE"') !== -1) return false
          if (fld.InternalName.indexOf('Gt') !== 0) return false
          return true
        })
      ]
      Logger.log({
        message: `(${this._name}) (syncPropertyItemToHub) Syncing ${fieldToSync.length} to hub entity.`,
        data: { fieldToSync: fieldToSync.map((f) => f.InternalName) },
        level: LogLevel.Info
      })
      const properties: TypedHash<any> = {}
      for (let i = 0; i < fieldToSync.length; i++) {
        const fld = fieldToSync[i]
        const fldValue = fieldValues[fld.InternalName]
        const fldValueTxt = fieldValuesText[fld.InternalName]
        switch (fld.TypeAsString) {
          case 'TaxonomyFieldType':
          case 'TaxonomyFieldTypeMulti':
            {
              let [textField] = fields.filter((f) => f.InternalName === `${fld.InternalName}Text`)
              if (textField) properties[textField.InternalName] = fieldValuesText[fld.InternalName]
              else {
                ;[textField] = fields.filter((f) => f.Id === fld.TextField)
                if (!textField) continue
                properties[textField.InternalName] = fieldValuesText[textField.InternalName]
              }
            }
            break
          case 'User':
            {
              const [siteUser] = siteUsers.filter(
                (u) => u.Id === fieldValues[`${fld.InternalName}Id`]
              )
              const user = siteUser
                ? await this.entityService.web.ensureUser(siteUser.LoginName)
                : null
              properties[`${fld.InternalName}Id`] = user ? user.data.Id : null
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
      Logger.log({
        message: `(${this._name}) (syncPropertyItemToHub) Syncing item to hub entity.`,
        data: { properties },
        level: LogLevel.Info
      })
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
})()
