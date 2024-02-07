import { stringIsNullOrEmpty } from '@pnp/core'
import { ItemFieldValue, ItemFieldValues } from './ItemFieldValues'
import { EditableSPField } from './EditableSPField'

export class EditableSPFieldValue {
  /**
   * `true` if the value is set. Checks text value with
   * `stringIsNullOrEmpty`.
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
   * Parses the field value from `fieldValues`, and
   * returns a new `EditableSPFieldValue` instance.
   *
   * @param fieldValues Field values from `IProjectInformationData`
   * @param field Field instance
   * @param currentValue Current value for the field if it's being edited
   */
  public static parse(fieldValues: ItemFieldValues, field: EditableSPField, currentValue = null) {
    const { value, valueAsText } = fieldValues.get<ItemFieldValue>(field.internalName, {
      format: 'object',
      defaultValue: {}
    })
    return new EditableSPFieldValue(currentValue ?? valueAsText, value)
  }
}
