import { SPField } from '../../models'

export interface IGetPropertiesData {
  /**
   * EditForm url
   */
  editFormUrl?: string

  /**
   * Version history url
   */
  versionHistoryUrl?: string

  /**
   * Field values - all fields in complex format
   */
  fieldValues?: Record<string, any>

  /**
   * Field values as text - all field values in string format
   */
  fieldValuesText?: Record<string, string>

  /**
   * Fields for the list
   */
  fields?: SPField[]

  /**
   * Properties list ID
   */
  propertiesListId?: string

  /**
   * Template parameters
   */
  templateParameters?: Record<string, any>
}
