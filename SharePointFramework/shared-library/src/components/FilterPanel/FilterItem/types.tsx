import { CheckboxProps } from '@fluentui/react-components'
import { IListColumn } from '../../../types'

/**
 * Describes a selectable filter value and its source column.
 */
export interface IFilterItemProps extends Pick<CheckboxProps, 'onChange'> {
  name: string
  value: string
  selected?: boolean
  column?: IListColumn
}
