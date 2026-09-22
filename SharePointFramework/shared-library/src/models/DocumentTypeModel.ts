import { supportedLocalesMap } from '../config'
import { getLocalizedProperty, getLocalProperties, getTermLabel, ITermInfo } from '../taxonomy'

/**
 * Model for a Document Type.
 */
export class DocumentTypeModel {
  public id: string
  private _languageTag: string

  /**
   * Constructor for `DocumentTypeModel`
   *
   * @param term Term info
   * @param _termSetId Term set ID
   * @param lcid Language code ID (default: `1044`)
   */
  constructor(
    public term: ITermInfo,
    private _termSetId: string,
    lcid: number = 1044
  ) {
    this.id = term.id
    this._languageTag = supportedLocalesMap.get(lcid)
  }

  /**
   * Document type name is the localized label of the term.
   * It uses the `lcid` property to get the correct label, then steps through
   * `nb-NO` and `en-US` before falling back to the first label (see `getTermLabel`).
   */
  public get name(): string {
    return getTermLabel(this.term, this._languageTag)
  }

  /**
   * Get document type term properties from the `localProperties` property using
   * the term set ID.
   */
  public get properties(): Record<string, string> {
    return getLocalProperties(this.term, this._termSetId)
  }

  /**
   * Is archiveable
   *
   * Uses local custom property `Archiveable` from the term
   */
  public get isArchiveable(): boolean {
    try {
      return JSON.parse(this.properties.Archiveable)
    } catch {
      return false
    }
  }

  /**
   * Returns a string representation of the document type model that can
   * be used to update the term field using the `TextField` connected
   * to the field.
   */
  public toString() {
    return `-1;#${this.name}|${this.id}`
  }

  /**
   * Get localized property value with fallback
   *
   * @param property Property name
   */
  private _getLocalizedProperty = (property: string): string => {
    return getLocalizedProperty(this.term, this._termSetId, property, this._languageTag)
  }
}
