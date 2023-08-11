import { stringIsNullOrEmpty } from '@pnp/core'
import { IGetPropertiesData } from '../services'
import { ProjectInformationField } from './ProjectInformationField'

export class ProjectInformationFieldValue {
  /**
   * `true` if the value is set
   */
  public isSet?: boolean

  /**
   * The text value of the field, from the current value
   * in the edit form, or from `FieldValuesText` in 
   * `IGetPropertiesData`
   */
  public value: string

  /**
   * The complex value of the field from `FieldValues` in
   * `IGetPropertiesData`
   */
  public $: any

  constructor(textValue: string, value: any) {
    this.isSet = !stringIsNullOrEmpty(textValue)
    this.value = textValue
    this.$ = value
  }

  /**
   * Parses the field value from `IGetPropertiesData`, and
   * returns a new `ProjectInformationFieldValue` instance.
   * 
   * @param propertiesData Properties data from `ProjectDataService.getProperties`
   * @param field Field instance
   * @param currentValue Current value for the field if it's being edited
   */
  public static parse(propertiesData: IGetPropertiesData, field: ProjectInformationField, currentValue = null) {
    const textValue = currentValue ?? propertiesData.fieldValuesText[field.internalName]
    const value = propertiesData.fieldValues[field.internalName]
    return new ProjectInformationFieldValue(textValue, value)
  }
}