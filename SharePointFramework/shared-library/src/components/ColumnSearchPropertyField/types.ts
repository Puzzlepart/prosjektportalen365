import { ITextFieldProps } from '@fluentui/react'

export interface IColumnSearchPropertyFieldProps extends Omit<ITextFieldProps, 'onChange'> {
  /**
   * On change handler for the field
   *
   * @param value The new value of the field
   */
  onChange: (value: string) => void

  /**
   * Managed properties to search for. If not provided, a Text field will be rendered
   * without any autocomplete functionality.
   */
  managedProperties?: string[]
}
