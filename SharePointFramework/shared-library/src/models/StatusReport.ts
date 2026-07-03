import { ItemFieldValues } from './ItemFieldValues'
import resource from 'SharedResources'
import { getStatusPageSeriesKey } from '../util/statusReportSeries'

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
   * Creates a new instance of `StatusReport` from a item field values object.
   *
   * @param fieldValues - SP item field values
   */
  constructor(public fieldValues: ItemFieldValues = new ItemFieldValues()) {
    this.id = fieldValues.id
    this.created = fieldValues.get('Created', { format: 'date' })
    this.modified = new Date(fieldValues.get('Modified', { format: 'date' }))
    this.publishedDate = fieldValues.get('GtLastReportDate', { format: 'date' })
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
   * If the JSON is invalid, null is returned. File name to get is `PersistedSectionDataJson.json`.
   */
  public get persistedSectionData(): Record<string, any> {
    const persistedSectionData = this._attachments.find(
      (a) => a.name?.toLowerCase() === 'persistedsectiondatajson.json'
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
    const snapshot = this._attachments.find((a) => a.name?.toLowerCase() === 'snapshot.png')
    if (snapshot) return snapshot.url
    return null
  }

  /**
   * Get url for the report page. Uses the status page URL stamped on the
   * report (`GtStatusPageUrl`) when present, falling back to the default
   * status page for reports belonging to the default series.
   *
   * @param urlSourceParam - URL source param
   */
  public url(urlSourceParam: string) {
    const pageUrl = this.statusPageUrl || resource.Navigation_ProjectStatus_Url
    return `${pageUrl}?selectedReport=${this.id}&Source=${encodeURIComponent(urlSourceParam)}`
  }

  /**
   * ID (`UniqueId`) of the status page the report belongs to, normalized to
   * lowercase. An empty string means the report belongs to the project's
   * default status page.
   */
  public get statusPageId(): string {
    return getStatusPageSeriesKey(
      this.fieldValues.get('GtStatusPageId', { format: 'text', defaultValue: '' })
    )
  }

  /**
   * Title of the status page the report belongs to. Empty for reports
   * belonging to the default status page.
   */
  public get statusPageTitle(): string {
    return this.fieldValues.get('GtStatusPageTitle', { format: 'text', defaultValue: '' }) ?? ''
  }

  /**
   * Site-relative URL of the status page the report belongs to. Empty for
   * reports belonging to the default status page.
   */
  public get statusPageUrl(): string {
    return this.fieldValues.get('GtStatusPageUrl', { format: 'text', defaultValue: '' }) ?? ''
  }

  /**
   * Get status values from item. All fields with a field name starting with `Gt` and ending with `Status`,
   * excluding the status page identity fields (`GtStatusPage*`).
   */
  public get statusValues(): Record<string, string> {
    return this.fieldValues.keys
      .filter((fieldName) => /^Gt.*Status/.test(fieldName) && !/^GtStatusPage/.test(fieldName))
      .reduce(
        (obj, fieldName) => ({
          ...obj,
          [fieldName]: this.fieldValues.get(fieldName, { format: 'text' })
        }),
        {}
      )
  }

  /**
   * Moderation status
   */
  public get moderationStatus(): string {
    return this.fieldValues.get('GtModerationStatus', { format: 'text' })
  }

  /**
   * Returns `true` if the report is published. The moderation status must
   * be `GtModerationStatus: Published` from the `SharedLibraryStrings`
   */
  public get published(): boolean {
    return this.moderationStatus === resource.Choice_GtModerationStatus_Published
  }

  /**
   * Get status values from item. If the values are not defined, an empty string is returned.
   *
   * @param fieldName - Field name
   */
  public getStatusValue(fieldName: string) {
    const commentFieldName = `${fieldName}Comment`
    return {
      value: this.fieldValues
        ? this.fieldValues.get(fieldName, { defaultValue: '', format: 'text' })
        : '',
      comment: this.fieldValues
        ? this.fieldValues.get(commentFieldName, { defaultValue: '', format: 'text' })
        : ''
    }
  }

  /**
   * Updates the field values of the current `StatusReport` instance with the specified properties.
   *
   * @param properties - An object containing key-value pairs representing the field names and values to update.
   */
  public setValues(properties: Record<string, string>) {
    this.fieldValues.update(properties)
    return this
  }
}
