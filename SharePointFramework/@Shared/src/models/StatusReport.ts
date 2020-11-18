import { TypedHash } from '@pnp/common'

export class StatusReport {
  public id: number
  public created: Date
  public defaultEditFormUrl: string

  /**
   * Creates a new instance of StatusReport
   *
   * @param {TypedHash} item SP item
   */
  constructor(private _item: TypedHash<any>) {
    this.id = _item.Id
    this.created = new Date(_item.Created)
  }

  public setDefaultEditFormUrl(defaultEditFormUrl: string) {
    this.defaultEditFormUrl = defaultEditFormUrl
    return this
  }

  /**
   * Get url for the report page
   *
   * @param {string} urlSourceParam Source param
   */
  public url(urlSourceParam: string) {
    return `SitePages/Prosjektstatus.aspx?selectedReport=${this.id}&Source=${encodeURIComponent(
      urlSourceParam
    )}`
  }

  /**
   * Get status values from item
   */
  public get statusValues(): TypedHash<string> {
    return Object.keys(this._item)
      .filter((fieldName) => fieldName.indexOf('Status') !== -1 && fieldName.indexOf('Gt') === 0)
      .reduce((obj, fieldName) => {
        obj[fieldName] = this._item[fieldName]
        return obj
      }, {})
  }

  /**
   * Budget numbers
   */
  public get budgetNumbers(): TypedHash<number> {
    return {
      GtBudgetTotal: this._item.GtBudgetTotal || 0,
      GtCostsTotal: this._item.GtCostsTotal || 0,
      GtProjectForecast: this._item.GtProjectForecast || 0
    }
  }

  /**
   * Field values
   */
  public get values(): TypedHash<string | number | boolean> {
    return this._item
  }

  /**
   * Field values
   */
  public get fieldValues(): TypedHash<string> {
    return this._item.FieldValuesAsText || this._item
  }

  public get moderationStatus(): string {
    return this._item.FieldValuesAsText.GtModerationStatus
  }

  /**
   * Get status values from item
   *
   * @param {string} fieldName Field name
   */
  public getStatusValue(fieldName: string): { value: string; comment: string } {
    return { value: this._item[fieldName], comment: this._item[`${fieldName}Comment`] }
  }

  /**
   * Edit form URL with added Source parameter
   */
  public get editFormUrl() {
    return [
      `${window.location.protocol}//${window.location.hostname}`,
      this.defaultEditFormUrl,
      '?ID=',
      this.id,
      '&Source=',
      encodeURIComponent(window.location.href)
    ].join('')
  }
}
