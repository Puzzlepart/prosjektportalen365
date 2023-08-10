import { IFieldInfo } from '@pnp/sp/fields'

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
  fields?: IFieldInfo[]

  /**
   * Properties list id
   */
  propertiesListId?: string

  /**
   * Template parameters
   */
  templateParameters?: Record<string, any>
}
