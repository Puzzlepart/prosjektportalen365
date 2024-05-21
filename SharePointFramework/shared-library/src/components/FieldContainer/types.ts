import { FieldProps, Slot } from '@fluentui/react-components'
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

  /**
   * The validation state of the field.
   */
  validationState?: 'error' | 'warning' | 'success' | 'none';

  /**
   * The validation message associated with the field.
   */
  validationMessage?: Slot<'div'>;
}
