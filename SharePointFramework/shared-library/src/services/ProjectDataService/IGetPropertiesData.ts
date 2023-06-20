import { IEntityField } from 'sp-entityportal-service'

export interface IGetPropertiesData {
  /**
   * Edit form URL
   */
  editFormUrl?: string

  /**
   * Version history URL
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
   * Property list fields
   */
  fields?: IEntityField[]

  /**
   * Properties list ID
   */
  propertiesListId?: string

  /**
   * Parameters for the template the project was configured with
   */
  templateParameters?: Record<string, any>
}
