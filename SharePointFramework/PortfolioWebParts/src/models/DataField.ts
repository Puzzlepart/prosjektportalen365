import { DataFieldType } from 'types'

export class DataField {
  public type: DataFieldType

  /**
   * Constructor
   *
   * @param {string} title Title
   * @param {string} fieldName Field name
   * @param {string} type Data field type
   */
  constructor(public title: string, public fieldName: string, type: string) {
    this.title = title
    this.fieldName = fieldName
    this.type = type.toLowerCase() as DataFieldType
  }
}
