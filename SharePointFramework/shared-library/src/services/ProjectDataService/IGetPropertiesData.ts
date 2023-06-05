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
   * Field values
   */
  fieldValues?: Record<string, any>

  /**
   * Field values as text
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
   *
   */
  templateParameters?: Record<string, any>
}
