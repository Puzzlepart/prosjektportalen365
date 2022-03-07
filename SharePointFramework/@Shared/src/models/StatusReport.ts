import { TypedHash } from '@pnp/common'
import { isEmpty } from 'underscore'

export type StatusReportAttachment = {
  FileName: string
  ServerRelativeUrl: string
}

export class StatusReport {
  public id: number
  public created: Date
  public defaultEditFormUrl: string
  public modified: Date
  public gtLastReportDate: Date
  public publishedDate: Date

  /**
   * Creates a new instance of StatusReport
   *
   * @param {TypedHash} item SP item
   * @param {string} _publishedString Published string
   */
  constructor(private _item: TypedHash<any>, private _publishedString?: string) {
    this.id = _item.Id
    this.created = new Date(_item.Created)
    this.modified = new Date(_item.Modified)
    this.gtLastReportDate = new Date(_item.GtLastReportDate)
    this.publishedDate = new Date(_item.GtLastReportDate)
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
   * Attachments
   */
  public get attachments(): StatusReportAttachment[] {
    return this._item.AttachmentFiles || []
  }

  /**
   * Has attachments
   */
  public get hasAttachments(): boolean {
    return !isEmpty(this.attachments)
  }

  /**
   * Field values
   */
  public get fieldValues(): TypedHash<string> {
    return this._item.FieldValuesAsText || this._item
  }

  /**
   * Moderation status
   */
  public get moderationStatus(): string {
    return this._item.FieldValuesAsText.GtModerationStatus
  }

  /**
   * Report published
   */
  public get published(): boolean {
    return this.moderationStatus === this._publishedString
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
      encodeURIComponent(`${window.location.origin}${window.location.pathname}`)
    ].join('')
  }
}
