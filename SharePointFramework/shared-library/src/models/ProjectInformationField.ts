import { IDropdownOption } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import { ProjectColumn } from './ProjectColumn'
import { ProjectInformationFieldValue } from './ProjectInformationFieldValue'
import { createProjectInformationFieldValueMap } from '../util/createProjectInformationFieldValueMap'
import { IProjectInformationData } from '../services/ProjectDataService/types'

/**
 * Project information field model. Used both for display
 * and edit of project information.
 */
export class ProjectInformationField {
  public id: string
  public internalName: string
  public displayName: string
  public description: string
  public type: string
  private _fieldValue: ProjectInformationFieldValue
  private _fieldValueMap: ReturnType<typeof createProjectInformationFieldValueMap>

  /**
   * Constructs a new `ProjectInformationField` instance.
   *
   * @param _field Field data
   * @param column Column data
   * @param _isExternal The current user is external with no access to portfolio level
   */
  constructor(
    private _field: Record<string, any>,
    public column: ProjectColumn,
    private _isExternal: boolean
  ) {
    this.id = _field.Id
    this.internalName = _field.InternalName
    this.displayName = column?.name ?? _field.Title
    this.description = _field.Description
    this.type = _field.TypeAsString
    this._fieldValueMap = createProjectInformationFieldValueMap()
  }

  /**
   * Sets the value for the field. Sets the value object that consists of
   * the following properties:
   * - `isSet` - `true` if the value is set
   * - `value` - the text value for the field
   * - `$` - the value for the field
   *
   * @param data Properties data from `ProjectDataService.getProjectInformationData`
   * @param currentValue Optional current value for the field if it's being edited
   *
   * @returns the field instance
   */
  public setValue(
    data: IProjectInformationData,
    currentValue: string = null
  ): ProjectInformationField {
    this._fieldValue = ProjectInformationFieldValue.parse(data, this, currentValue)
    return this
  }

  /**
   * Get value for the field. Uses `createProjectInformationFieldValueMap` to
   * create a Map of field types and functions to get the value for the field.
   * If the field type is not found in the map the `text` property is used.
   */
  public getParsedValue<T>(): T {
    const fieldValue = this._fieldValueMap.has(this.type)
      ? this._fieldValueMap.get(this.type)(this._fieldValue)
      : this._fieldValue.value
    return fieldValue as unknown as T
  }

  /**
   * Get a property for the field by property name.
   *
   * E.g. `getPropery('ShowInEditForm')` or `getProperty('ShowInDisplayFom')`
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
   * Returns `true` if the field should be visible in the
   * specified display mode. When checking for `DisplayMode.Read``
   * the `props.page` property is used to determine which properties to display.
   *
   * Also handles using `showFieldExternal` property to determine if
   * the field should be visible for external users with no access to
   * portfolio level.
   *
   * @param displayMode Display mode
   * @param props Props - need to pass `props.page` when checking for `DisplayMode.Read`,
   * and `props.showFieldExternal` when checking for external users that have no access to
   * portfolio level.
   */
  public isVisible(displayMode: DisplayMode, props?: any): boolean {
    switch (displayMode) {
      case DisplayMode.Edit:
        return this._field.ShowInEditForm && !this._field.Hidden
      case DisplayMode.Read: {
        if (this._isExternal) return props.showFieldExternal[this.internalName]
        return this.column.isVisible(props.page)
      }
    }
  }

  /**
   * Returns `true` if the value for the field is empty.
   */
  public get isEmpty(): boolean {
    return !this._fieldValue?.isSet
  }
}
