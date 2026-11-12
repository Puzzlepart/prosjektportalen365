import { ButtonProps } from '@fluentui/react-components'

/** Appearance overrides for the field's task-management button. */
export interface IRiskActionFieldValueProps {
  adminButton?: Pick<ButtonProps, 'appearance' | 'size'>
}
