import { InputProps } from '@fluentui/react-components'

export interface IColumnSearchPropertyFieldProps extends Omit<InputProps, 'onChange'> {
  /**
   * Label for the field. The Fluent UI v9 `Input` has no label of its own, so
   * it is declared here and rendered by the surrounding field.
   */
  label?: string

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
