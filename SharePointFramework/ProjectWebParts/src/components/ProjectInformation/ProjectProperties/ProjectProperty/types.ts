import { DisplayMode } from '@microsoft/sp-core-library'
import { TypedHash } from '@pnp/common'
import { IEntityField } from 'sp-entityportal-service'
import { stringIsNullOrEmpty } from '@pnp/common'

type ProjectPropertyModelType = 'user' | 'usermulti' | 'taxonomyfieldtypemulti' | 'url'

export class ProjectPropertyModel {
  /**
   * Internal name of the field
   */
  public internalName: string

  /**
   * Display name of the field
   */
  public displayName: string

  /**
   * Description of the field
   */
  public description: string

  /**
   * Value for the field
   */
  public value?: string

  /**
   * Type of the field
   */
  public type?: ProjectPropertyModelType

  /**
   * Creates an instance of ProjectPropertyModel
   *
   * @param field Field
   * @param value Value
   */
  constructor(field: IEntityField, value: string) {
    this.internalName = field.InternalName
    this.displayName = field.Title
    this.description = field.Description
    this.value = value
    this.type = field.TypeAsString.toLowerCase() as ProjectPropertyModelType
  }

  public get empty() {
    return stringIsNullOrEmpty(this.value)
  }
}

export interface IProjectPropertyProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Project property model
   */
  model: ProjectPropertyModel

  /**
   * Display mode
   */
  displayMode?: DisplayMode

  /**
   * On field external changed
   */
  onFieldExternalChanged?: (fieldName: string, checked: boolean) => void

  /**
   * A hash object of fields to show for external users
   */
  showFieldExternal?: TypedHash<boolean>
}
