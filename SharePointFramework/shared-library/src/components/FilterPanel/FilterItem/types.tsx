import { IColumn } from '@fluentui/react'
import { CheckboxProps } from '@fluentui/react-components'

export interface IFilterItemProps extends Pick<CheckboxProps, 'onChange'> {
  name: string
  value: string
  selected?: boolean
  column?: IColumn
}
