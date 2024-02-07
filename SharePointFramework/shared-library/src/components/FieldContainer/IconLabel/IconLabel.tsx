import { Label } from '@fluentui/react-components'
import React, { FC } from 'react'
import { getFluentIcon } from '../../../icons'
import { IFieldContainerProps } from '../types'
import styles from './IconLabel.module.scss'

export const IconLabel: FC<IFieldContainerProps> = (props) => {
  return (
    <div className={styles.iconLabel}>
      {getFluentIcon(props.iconName)}
      <Label size='small' weight='semibold' required={props.required}>
        {props.label}
      </Label>
    </div>
  )
}
