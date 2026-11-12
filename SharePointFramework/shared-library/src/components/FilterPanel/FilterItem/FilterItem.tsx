import { Checkbox } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './FilterItem.module.scss'
import { IFilterItemProps } from './types'
import { useFilterItem } from './useFilterItem'

/**
 * Renders a filter value as a labeled checkbox.
 */
export const FilterItem: FC<IFilterItemProps> = (props) => {
  const { label } = useFilterItem(props)
  return (
    <Checkbox
      className={styles.filterItem}
      label={label}
      checked={props.selected}
      onChange={props.onChange}
    />
  )
}
