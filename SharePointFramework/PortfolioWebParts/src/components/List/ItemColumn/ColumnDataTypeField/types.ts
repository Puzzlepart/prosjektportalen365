import {
  ICheckboxProps,
  IDropdownProps,
  IIconProps,
  ISelectableOption,
  ITextFieldProps,
  IToggleProps
} from '@fluentui/react'
import { FunctionComponent } from 'react'

export interface IColumnDataTypePropertyFieldProps<
  T = ITextFieldProps | ICheckboxProps | IToggleProps
> {
  /**
   * A function component with the props specified by `T`.
   */
  type: FunctionComponent<T>

  /**
   * The property field props for the component.
   */
  props: T
}
export type IColumnDataTypePropertyField<T = any> = IColumnDataTypePropertyFieldProps<T>

/**
 * Creates an object with a function component and its props.
 *
 * @template T The type of the props for the function component.
 * @param type A function component with the props specified by `T`.
 * @param props The property field props for the component.
 *
 * @returns An object with the function component and its props.
 */
export function ColumnDataTypePropertyField<T>(
  type: FunctionComponent<T>,
  props: T
): IColumnDataTypePropertyField<T> {
  return { type, props } as IColumnDataTypePropertyField<T>
}

export type GetDataTypeProperties = (
  onChange: (key: string, value: any) => void,
  dataTypeProperties: Record<string, any>
) => IColumnDataTypePropertyField[]

type IColumnDataTypeFieldOptionData = {
  /**
   * Icon props for the option. Only `iconName` is supported,
   * as we've not implemented propert support for any
   * additional icon props.
   */
  iconProps: Pick<IIconProps, 'iconName'>

  /**
   * Get properties for the data type.
   *
   * @param onChange On change handler for the property field
   * @param dataTypeProperties Current data type properties for the data type
   */
  getDataTypeProperties?: GetDataTypeProperties
}

export type IColumnDataTypeFieldOption = ISelectableOption<IColumnDataTypeFieldOptionData>

export interface IColumnDataTypeFieldProps extends Pick<IDropdownProps, 'defaultSelectedKey'> {
  description: string

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
  persistRenderGloballyField?: ICheckboxProps
}
