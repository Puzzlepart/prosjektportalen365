import { TypedHash } from '@pnp/common'
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
  fieldValues?: TypedHash<any>

  /**
   * Field values as text
   */
  fieldValuesText?: TypedHash<string>

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
  templateParameters?: TypedHash<any>
}
