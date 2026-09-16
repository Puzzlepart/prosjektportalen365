import { ITermInfo } from '@pnp/sp/taxonomy'
import _ from 'underscore'
import { supportedLocalesMap } from 'pp365-shared-library'

/**
 * Model for a Taxonomy Term used in list columns.
 */
export class TaxonomyTermModel {
  public id: string
  private _languageTag: string

  /**
   * Constructor for `TaxonomyTermModel`
   *
   * @param term Term info from taxonomy API
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
   * Term name is the localized label of the term.
   * Uses the `lcid` property to get the correct label.
   * Falls back to the first label if localized label is not found.
   */
  public get name(): string {
    const localizedLabel = _.find(
      this.term.labels,
      (l) => l.languageTag.toLowerCase() === this._languageTag
    )
    return localizedLabel?.name ?? _.first(this.term.labels)?.name
  }

  /**
   * Get term properties from the `localProperties` property using
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
   * Returns a string representation of the term that can be used
   * to update the taxonomy field using the `TextField`.
   */
  public toString(): string {
    return `-1;#${this.name}|${this.id}`
  }
}
