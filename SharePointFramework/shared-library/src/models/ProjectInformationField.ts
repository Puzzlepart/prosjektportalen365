import { DisplayMode } from '@microsoft/sp-core-library'
import _ from 'lodash'
import { createFieldValueMap, getObjectValue as get } from '../util'
import { ItemFieldValues } from './ItemFieldValues'
import { ProjectColumn, ProjectColumnFieldOverride } from './ProjectColumn'
import { ProjectInformationFieldValue } from './ProjectInformationFieldValue'
import { SPField } from './SPField'

/**
 * Project information field model. Used both for display
 * and edit of project information.
 */
export class ProjectInformationField extends SPField {
  /**
   * The ID of the field.
   */
  public id: string

  /**
   * The internal name of the field.
   */
  public internalName: string

  /**
   * The display name of the field.
   */
  public displayName: string

  /**
   * The description of the field.
   */
  public description: string

  /**
   * The type of the field.
   */
  public type: string

  /**
   * The column of the field.
   */
  public column: ProjectColumn

  /**
   * Whether the field is read-only.
   */
  public isReadOnly: boolean

  /**
   * Whether the field is external.
   */
  private _isExternal: boolean

  /**
   * The value of the field.
   */
  private _fieldValue: ProjectInformationFieldValue

  /**
   * The map of field values.
   */
  private _fieldValueMap: ReturnType<typeof createFieldValueMap>

  /**
   * The current locale.
   */
  private _currentLocale: string

  /**
   * The configuration name.
   */
  private _configurationName: string

  /**
   * Constructs a new `ProjectInformationField` instance from either
   * a `SPField` or `IEntityField`.
   *
   * @param _field Field information
   */
  constructor(private _field: SPField) {
    super(_field)
    this.id = _field.Id
    this.internalName = _field.InternalName
    this.displayName = _field.Title
    this.description = _field.Description
    this.type = _field.TypeAsString
    this.isReadOnly = _field.SchemaXml ? _field.SchemaXml.indexOf('ReadOnly="TRUE"') !== -1 : false
    this._fieldValueMap = createFieldValueMap()
  }

  /**
   * Initializes the field with the columns from `ProjectDataService`.
   *
   * @param columns Columns from `ProjectDataService`
   * @param currentLocale Current locale
   * @param configurationName Configuration name
   */
  public init(columns: ProjectColumn[], currentLocale?: string, configurationName?: string) {
    this.column = columns.find((c) => c.internalName === this.internalName)
    this._isExternal = _.isEmpty(columns)
    this._initConfiguration(currentLocale, configurationName)
    return this
  }

  /**
   * Initializes the configuration for the field. If a entry is found for the `configurationName`
   * in `column.data.fieldOverrides` the configuration is set for the field.
   *
   * @param currentLocale Current locale (e.g. `nb-no` for Norwegian)
   * @param configurationName Configuration name (e.g. `Program`)
   */
  private _initConfiguration(currentLocale: string, configurationName: string) {
    this._currentLocale = currentLocale
    this._configurationName = configurationName
    if (this._configurationName && this.column) {
      const configuration = get<ProjectColumnFieldOverride>(
        this.column,
        `data.fieldOverrides.${this._configurationName}.${this._currentLocale}`,
        null
      )
      this.displayName = configuration?.displayName ?? this.displayName
      this.description = configuration?.description ?? this.description
    }
  }

  /**
   * Sets the value for the field. Sets the value object that consists of
   * the following properties:
   * - `isSet` - `true` if the value is set
   * - `value` - the text value for the field
   * - `$` - the value for the field
   *
   * @param fieldValues Field values from `IProjectInformationData`
   * @param currentValue Optional current value for the field if it's being edited
   *
   * @returns the current field instance
   */
  public setValue(
    fieldValues: ItemFieldValues,
    currentValue: string = null
  ): ProjectInformationField {
    this._fieldValue = ProjectInformationFieldValue.parse(fieldValues, this, currentValue)
    return this
  }

  /**
   * Get value for the field. Uses `createProjectInformationFieldValueMap` to
   * create a Map of field types and functions to get the value for the field.
   * If the field type is not found in the map the `text` property is used.
   */
  public getParsedValue<T>(): T {
    if (this._fieldValueMap.has(this.type)) {
      return this._fieldValueMap.get(this.type)(this._fieldValue) as unknown as T
    }
    return this._fieldValue.value as unknown as T
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
   * Get choices for a choice field as `string[]`.
   */
  public get choices(): string[] {
    return this._field.Choices ?? []
  }

  /**
   * Returns `true` if the field should be visible in the
   * specified display mode. When checking for `DisplayMode.Read`
   * the `props.page` property is used to determine which properties to display.
   *
   * Also handles using `showFieldExternal` property to determine if
   * the field should be visible for external users with no access to
   * portfolio level.
   *
   * @param displayMode Display mode to check for
   * @param page Page name to check for
   * @param showFieldExternal Object with field internal name as key and boolean as value
   */
  public isVisible(
    displayMode: DisplayMode,
    page?: 'Frontpage' | 'ProjectStatus' | 'Portfolio',
    showFieldExternal?: Record<string, boolean>
  ): boolean {
    switch (displayMode) {
      case DisplayMode.Edit:
        return this._field.ShowInEditForm && !this._field.Hidden && !this.isReadOnly
      case DisplayMode.Read: {
        if (this._isExternal) return showFieldExternal[this.internalName]
        return this.column ? this.column.isVisible(page) : false
      }
    }
  }

  /**
   * Returns `true` if the value for the field is empty.
   */
  public get isEmpty(): boolean {
    return !this._fieldValue?.isSet
  }

  /**
   * Clones the field returning a new instance of the field.
   *
   * @returns a clone of the field
   */
  public clone() {
    return new ProjectInformationField(this._field).init(
      [this.column].filter(Boolean),
      this._currentLocale,
      this._configurationName
    )
  }
}
