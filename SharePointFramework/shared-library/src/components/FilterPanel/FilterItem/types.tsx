import { CheckboxProps } from '@fluentui/react-components'
import { IListColumn } from '../../../types'

export interface IFilterItemProps extends Pick<CheckboxProps, 'onChange'> {
  name: string
  value: string
  selected?: boolean
  column?: IListColumn
}
