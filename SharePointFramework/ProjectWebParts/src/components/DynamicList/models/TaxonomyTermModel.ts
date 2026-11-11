import {
  getLocalProperties,
  getTermLabel,
  ITermInfo,
  supportedLocalesMap
} from 'pp365-shared-library'

/**
 * Model for a Taxonomy Term used in list columns.
 */
export class TaxonomyTermModel {
  public id: string
  private _languageTag: string

  /**
   * Constructor for `TaxonomyTermModel`
   *
   * @param term Term info from the term store
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
   * It uses the `lcid` property to get the correct label, then steps through
   * `nb-NO` and `en-US` before falling back to the first label (see `getTermLabel`).
   */
  public get name(): string {
    return getTermLabel(this.term, this._languageTag)
  }

  /**
   * Get term properties from the `localProperties` property using
   * the term set ID.
   */
  public get properties(): Record<string, string> {
    return getLocalProperties(this.term, this._termSetId)
  }

  /**
   * Returns a string representation of the term that can be used
   * to update the taxonomy field using the `TextField`.
   */
  public toString(): string {
    return `-1;#${this.name}|${this.id}`
  }
}
