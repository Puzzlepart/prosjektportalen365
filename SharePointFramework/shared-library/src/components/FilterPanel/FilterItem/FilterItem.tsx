
import React, { FC } from 'react'
import styles from './FilterItem.module.scss'
import { IFilterItemProps } from './types'
import { Checkbox } from '@fluentui/react-components'


export const FilterItem: FC<IFilterItemProps> = (props) => {
  return (
    <li>
      <div className={styles.filterItem}>
        <Checkbox label={props.name} checked={props.selected} onChange={props.onChange} />
      </div>
    </li>
  )
}
