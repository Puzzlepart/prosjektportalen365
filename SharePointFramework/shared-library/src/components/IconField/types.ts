import { FieldProps } from '@fluentui/react-components'
import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'

/**
 * Props for the IconField component.
 */
export interface IIconFieldProps extends FieldProps {
  /**
   * The icon for the label component.
   */
  icon?: FluentIcon
}
