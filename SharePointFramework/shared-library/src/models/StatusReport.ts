import strings from 'SharedLibraryStrings'
import { ItemFieldValues } from './ItemFieldValues'
import resource from 'SharedResources'

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
   * Get url for the report page
   *
   * @param urlSourceParam - URL source param
   */
  public url(urlSourceParam: string) {
    return `${resource.Navigation_ProjectStatus_Url}?selectedReport=${
      this.id
    }&Source=${encodeURIComponent(urlSourceParam)}`
  }

  /**
   * Get status values from item. All fields with a field name starting with `Gt` and ending with `Status`
   */
  public get statusValues(): Record<string, string> {
    return this.fieldValues.keys
      .filter((fieldName) => /^Gt.*Status/.test(fieldName))
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
   * be `GtModerationStatus_Choice_Published` from the `SharedLibraryStrings`
   */
  public get published(): boolean {
    return this.moderationStatus === strings.GtModerationStatus_Choice_Published
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
