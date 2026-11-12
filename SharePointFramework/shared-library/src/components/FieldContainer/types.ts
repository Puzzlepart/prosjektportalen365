import { FieldProps, Slot } from '@fluentui/react-components'
import { FluentIconName } from '../../icons/types'

/**
 * Adds an optional icon and description to Fluent field presentation.
 */
export interface IFieldContainerProps extends FieldProps {
  iconName?: FluentIconName

  description?: string

  validationState?: 'error' | 'warning' | 'success' | 'none'

  validationMessage?: Slot<'div'>
}
