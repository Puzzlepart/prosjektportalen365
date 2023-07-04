import { ITextFieldProps } from '@fluentui/react'

export interface IColumnSearchPropertyFieldProps extends Omit<ITextFieldProps, 'onChange'> {
  onChange: (value: string) => void
}
