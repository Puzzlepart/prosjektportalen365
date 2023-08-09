import { ProjectColumn } from 'pp365-shared-library/lib/models'
import { IDropdownOption } from '@fluentui/react'

export class ProjectInformationField {
  public id: string
  public internalName: string
  public displayName: string
  public description: string
  public type: string
  private _value: any

  /**
   * Constructs a new `ProjectInformationField` object from
   * a field from the entity and a column configuration.
   *
   * @param _field Field from the entity
   * @param column Column configuration
   */
  constructor(private _field: Record<string, any>, column: ProjectColumn) {
    this.id = _field.Id
    this.internalName = _field.InternalName
    this.displayName = column?.name ?? _field.Title
    this.description = _field.Description
    this.type = _field.TypeAsString
  }

  /**
   * Sets the value for the field.
   *
   * @param value Value to set
   *
   * @returns the field instance
   */
  public setValue(value: any): ProjectInformationField {
    this._value = value
    return this
  }

  /**
   * Get value for the field. Optionally split by characters.
   *
   * @param splitBy Characters to split by (optional)
   */
  public getValue<T>(splitBy?: string): T {
    return splitBy ? this._value?.split(splitBy) : this._value
  }

  /**
   * Get a property for the field by property name.
   *
   * @param propertyName Property name
   */
  public getProperty(propertyName: string): string {
    return this._field[propertyName]
  }

  /**
   * Get choices for a choice field as `IDropdownOption[]`.
   */
  public get choices(): IDropdownOption[] {
    return (this._field.Choices as string[]).map((c) => ({ key: c, text: c }))
  }

  /**
   * Returns `true` if the field should be visible in edit form.
   * `ShowInEditForm` must be `true` and `Hidden` must be `false`.
   */
  public get showInEditForm(): boolean {
    return this._field.ShowInEditForm && !this._field.Hidden
  }

  /**
   * Returns `true` if the value for the field is empty.
   */
  public get isEmpty(): boolean {
    return this._value === null || this._value === undefined || this._value === ''
  }
}
