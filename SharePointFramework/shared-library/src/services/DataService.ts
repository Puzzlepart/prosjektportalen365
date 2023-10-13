import { SPField } from '../models'

export class DataService<T> {
  protected _configuration: T
  protected _isConfigured: boolean = false

  constructor(isConfigured: boolean = false) {
    this._isConfigured = isConfigured
  }

  /**
   * Sets the configuration for the DataService.
   *
   * @param configuration - The configuration object to set.
   */
  protected onConfigureStart(configuration: T) {
    this._configuration = configuration
  }

  /**
   * Marks the DataService as configured.
   *
   * @returns The DataService instance.
   */
  protected onConfigured() {
    this._isConfigured = true
    return this
  }

  /**
   * Mapping fields to include `ShowInEditForm`, `ShowInNewForm` and `ShowInDisplayForm`
   * which is only present in `SchemaXml`, not as separate properties.
   *
   * @param fields Fields to map
   */
  protected _mapFields(fields: SPField[]): SPField[] {
    return fields.map<SPField>((fld) => ({
      ...fld,
      ShowInEditForm: fld.SchemaXml.indexOf('ShowInEditForm="FALSE"') === -1,
      ShowInNewForm: fld.SchemaXml.indexOf('ShowInNewForm="FALSE"') === -1,
      ShowInDisplayForm: fld.SchemaXml.indexOf('ShowInDisplayForm="FALSE"') === -1
    }))
  }
}
