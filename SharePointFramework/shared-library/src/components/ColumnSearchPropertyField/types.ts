import { InputProps } from '@fluentui/react-components'

/**
 * Configures selection or free entry of a managed property.
 */
export interface IColumnSearchPropertyFieldProps extends Omit<InputProps, 'onChange'> {
  /**
   * Label for the field. The Fluent UI v9 `Input` has no label of its own, so
   * it is declared here and rendered by the surrounding field.
   */
  label?: string

  /**
   * On change handler for the field
   */
  onChange: (value: string) => void

  /**
   * Managed properties to search for. If not provided, a Text field will be rendered
   * without any autocomplete functionality.
   */
  managedProperties?: string[]
}
