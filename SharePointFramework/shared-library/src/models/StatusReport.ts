export type StatusReportAttachment = {
  name?: string
  url: string
  content?: string | ArrayBuffer | Blob
  shouldOverWrite?: boolean
}

/**
 * Status report model. Represents a status report item in SharePoint.
 */
export class StatusReport {
  public id: number
  public created: Date
  public defaultEditFormUrl: string
  public modified: Date
  public publishedDate: Date
  private _attachments: StatusReportAttachment[] = []

  /**
   * Creates a new instance of StatusReport
   *
   * @param item - SP item
   * @param _publishedString Published string
   */
  constructor(public item: Record<string, any>, private _publishedString?: string) {
    this.id = item.Id
    this.created = new Date(item.Created)
    this.modified = new Date(item.Modified)
    this.publishedDate = item.GtLastReportDate ? new Date(item.GtLastReportDate) : null
  }

  /**
   * Initialize attachments for the report and returns the report.
   *
   * @param attachments Attachments
   */
  public initAttachments(attachments: StatusReportAttachment[]): StatusReport {
    this._attachments = attachments
    return this
  }

  /**
   * Get persisted section data from the report. If no persisted section data is found, null is returned.
   * If the JSON is invalid, null is returned.
   */
  public get persistedSectionData(): Record<string, any> {
    const persistedSectionData = this._attachments.find(
      (a) => a.name.toLowerCase() === 'persistedsectiondata.json'
    )
    try {
      if (persistedSectionData) {
        return JSON.parse(persistedSectionData.content as string)
      }
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Get snapshot url for the report.
   */
  public get snapshotUrl(): string {
    const snapshot = this._attachments.find((a) => a.name.toLowerCase() === 'snapshot.png')
    if (snapshot) return snapshot.url
    return null
  }

  /**
   * Get url for the report page
   *
   * @param urlSourceParam - URL source param
   */
  public url(urlSourceParam: string) {
    return `SitePages/Prosjektstatus.aspx?selectedReport=${this.id}&Source=${encodeURIComponent(
      urlSourceParam
    )}`
  }

  /**
   * Get status values from item
   */
  public get statusValues(): Record<string, string> {
    return Object.keys(this.item)
      .filter((fieldName) => fieldName.indexOf('Status') !== -1 && fieldName.indexOf('Gt') === 0)
      .reduce((obj, fieldName) => {
        obj[fieldName] = this.item[fieldName]
        return obj
      }, {})
  }

  /**
   * Budget numbers
   */
  public get budgetNumbers(): Record<string, number> {
    return {
      GtBudgetTotal: this.item.GtBudgetTotal || 0,
      GtCostsTotal: this.item.GtCostsTotal || 0,
      GtProjectForecast: this.item.GtProjectForecast || 0
    }
  }

  /**
   * Field values
   */
  public get values(): Record<string, any> {
    return this.item
  }

  /**
   * Field values
   */
  public get fieldValues(): Record<string, string> {
    return this.item.FieldValuesAsText || this.item
  }

  /**
   * Moderation status
   */
  public get moderationStatus(): string {
    return this.item.GtModerationStatus
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
   * @param fieldName - Field name
   */
  public getStatusValue(fieldName: string): { value: string; comment: string } {
    return { value: this.item[fieldName], comment: this.item[`${fieldName}Comment`] }
  }
}