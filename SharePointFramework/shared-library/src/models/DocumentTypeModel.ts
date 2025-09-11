import { ITermInfo } from '@pnp/sp/taxonomy'
import _ from 'underscore'
import { supportedLocalesMap } from '../config'

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
   * It uses the `lcid` property to get the correct label.
   * If the label is not found, it falls back to the first label.
   */
  public get name(): string {
    const localizedLabel = _.find(
      this.term.labels,
      (l) => l.languageTag.toLowerCase() === this._languageTag
    )
    return localizedLabel?.name ?? _.first(this.term.labels)?.name
  }

  /**
   * Get document type term properties from the `localProperties` property using
   * the term set ID.
   */
  public get properties(): Record<string, string> {
    const { properties } = _.find(this.term.localProperties, (p) => p.setId === this._termSetId)
    if (!properties) return {}
    return properties.reduce((acc, p) => {
      acc[p.key] = p.value
      return acc
    }, {})
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
    const propertyValue = this.properties[`${property}_${this._languageTag}`]
    if (propertyValue) {
      return propertyValue
    }
    const defaultPropertyValue = this.properties[property]
    return defaultPropertyValue
  }
}
