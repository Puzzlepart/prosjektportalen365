import React, { FC } from 'react'
import styles from './FilterItem.module.scss'
import { IFilterItemProps } from './types'
import { Checkbox } from '@fluentui/react-components'

export const FilterItem: FC<IFilterItemProps> = (props) => {
  return (
    <Checkbox
      className={styles.filterItem}
      label={props.name}
      checked={props.selected}
      onChange={props.onChange}
    />
  )
}
