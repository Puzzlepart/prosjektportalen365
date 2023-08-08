import { DataFieldType } from 'pp365-shared-library'

export class DataField {
  public type: DataFieldType

  /**
   * Constructor
   *
   * @param title Title
   * @param fieldName Field name
   * @param type Data field type
   */
  constructor(public title: string, public fieldName: string, type: string) {
    this.title = title
    this.fieldName = fieldName
    this.type = type.toLowerCase() as DataFieldType
  }
}
