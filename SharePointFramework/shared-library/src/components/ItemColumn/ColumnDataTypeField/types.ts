import { SwitchProps } from '@fluentui/react-components'

interface IColumnDataTypePropertyFieldBase {
  /**
   * Label shown for the field.
   */
  label: string

  /**
   * Help text shown under the field.
   */
  description?: string

  /**
   * Whether the field can be edited.
   */
  disabled?: boolean
}

/**
 * A boolean property, shown as a switch or a checkbox.
 */
export interface IBooleanPropertyField extends IColumnDataTypePropertyFieldBase {
  kind: 'switch' | 'checkbox'
  checked?: boolean
  onChange: (checked: boolean) => void
}

/**
 * A text property, single-line unless `multiline`.
 */
export interface ITextPropertyField extends IColumnDataTypePropertyFieldBase {
  kind: 'text'
  value?: string
  placeholder?: string
  multiline?: boolean
  onChange: (value: string) => void
}

/**
 * A numeric property. `onChange` receives a number, or `undefined` when the field is cleared.
 */
export interface INumberPropertyField extends IColumnDataTypePropertyFieldBase {
  kind: 'number'
  value?: number
  placeholder?: string
  onChange: (value: number | undefined) => void
}

/**
 * A property a column renderer lets the user configure, as the column form shows it.
 *
 * A renderer describes its properties in these terms and nothing else; `DataTypeFields` is the one
 * place that turns a kind into a control. Renderers used to hand over a Fluent UI v8 component
 * reference with v8 props, which tied every renderer to v8 for the sake of a form it never rendered.
 */
export type IColumnDataTypePropertyField =
  IBooleanPropertyField | ITextPropertyField | INumberPropertyField

type FieldInput<T extends IColumnDataTypePropertyField> = Omit<T, 'kind'>

/**
 * Describes a boolean property shown as a switch.
 */
export function switchField(field: FieldInput<IBooleanPropertyField>): IBooleanPropertyField {
  return { kind: 'switch', ...field }
}

/**
 * Describes a boolean property shown as a checkbox.
 */
export function checkboxField(field: FieldInput<IBooleanPropertyField>): IBooleanPropertyField {
  return { kind: 'checkbox', ...field }
}

/**
 * Describes a text property.
 */
export function textField(field: FieldInput<ITextPropertyField>): ITextPropertyField {
  return { kind: 'text', ...field }
}

/**
 * Describes a numeric property.
 */
export function numberField(field: FieldInput<INumberPropertyField>): INumberPropertyField {
  return { kind: 'number', ...field }
}

export type GetDataTypeProperties = (
  onChange: (key: string, value: any) => void,
  dataTypeProperties: Record<string, any>
) => IColumnDataTypePropertyField[]

/**
 * An entry in the data type dropdown. Built by `ColumnRenderComponentRegistry` from the registered
 * column renderers; replaces the Fluent UI v8 `ISelectableOption` it used to be.
 */
export interface IColumnDataTypeFieldOption {
  /**
   * The renderer's key, for internal use.
   */
  key: string

  /**
   * The value stored in the column's data type field.
   */
  id: string

  /**
   * Text shown for the option.
   */
  text: string

  /**
   * Whether the option can be chosen. A disabled option is still listed.
   */
  disabled?: boolean

  data?: {
    /**
     * Icon shown with the option, by name.
     */
    iconProps: { iconName: string }

    /**
     * Get properties for the data type.
     *
     * @param onChange On change handler for the property field
     * @param dataTypeProperties Current data type properties for the data type
     */
    getDataTypeProperties?: GetDataTypeProperties
  }
}

export interface IColumnDataTypeFieldProps {
  label: string
  description: string

  /**
   * Key of the data type selected when the field first renders.
   */
  defaultSelectedKey?: string

  /**
   * Change event handler for the data type field.
   *
   * @param value New value for the data type property
   */
  onChange: (value: string) => void

  /**
   * Current properties for the data type
   */
  dataTypeProperties?: Record<string, any>

  /**
   * On data type properties change handler.
   *
   * @param properties Properties for the data type
   */
  onDataTypePropertiesChange?: (properties: Record<string, any>) => void

  /**
   * Checkbox field for persisting render globally
   */
  persistRenderGloballyField?: SwitchProps
}
