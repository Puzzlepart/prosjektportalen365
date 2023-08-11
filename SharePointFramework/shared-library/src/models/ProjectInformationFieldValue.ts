import { stringIsNullOrEmpty } from '@pnp/core'
import { IProjectInformationData } from '../services/ProjectDataService/types'
import { ProjectInformationField } from './ProjectInformationField'

export class ProjectInformationFieldValue {
  /**
   * `true` if the value is set
   */
  public isSet?: boolean

  /**
   * The text value of the field, from the current value
   * in the edit form, or from `FieldValuesText` in
   * `IProjectInformationData`
   */
  public value: string

  /**
   * The complex value of the field from `FieldValues` in
   * `IProjectInformationData`
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
   * @param data Properties data from `ProjectDataService.getProjectInformationData`
   * @param field Field instance
   * @param currentValue Current value for the field if it's being edited
   */
  public static parse(
    data: IProjectInformationData,
    field: ProjectInformationField,
    currentValue = null
  ) {
    const textValue = currentValue ?? data.fieldValuesText[field.internalName]
    const value = data.fieldValues[field.internalName]
    return new ProjectInformationFieldValue(textValue, value)
  }
}
