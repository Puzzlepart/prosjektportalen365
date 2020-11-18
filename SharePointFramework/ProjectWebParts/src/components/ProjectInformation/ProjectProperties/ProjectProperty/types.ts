import { DisplayMode } from '@microsoft/sp-core-library'
import { TypedHash } from '@pnp/common'
import { IEntityField } from 'sp-entityportal-service'
import { stringIsNullOrEmpty } from '@pnp/common'

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
  public type?: string

  /**
   * Creates an instance of ProjectPropertyModel
   *
   * @param {IEntityField} field Field
   * @param {string} value Value
   */
  constructor(private _field: IEntityField, value: string) {
    this.internalName = _field.InternalName
    this.displayName = _field.Title
    this.description = _field.Description
    this.value = value
    this.type = _field.TypeAsString
  }

  public get visible() {
    return this._field.SchemaXml.indexOf('ShowInDisplayForm="FALSE"') === -1
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
