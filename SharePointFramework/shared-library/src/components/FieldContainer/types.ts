import { FieldProps } from '@fluentui/react-components'
import { FluentIconName } from '../../icons/types'

export interface IFieldContainerProps extends FieldProps {
  /**
   * The name of the Fluent icon to display.
   */
  iconName?: FluentIconName

  /**
   * Description of the field.
   */
  description?: string
}
