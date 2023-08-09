import { IEntityField } from 'sp-entityportal-service'

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
   * Entity fields
   */
  fields?: IEntityField[]

  /**
   * Properties list id
   */
  propertiesListId?: string

  /**
   * Template parameters
   */
  templateParameters?: Record<string, any>
}
