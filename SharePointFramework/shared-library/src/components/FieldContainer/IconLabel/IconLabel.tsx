import { Label, Text } from '@fluentui/react-components'
import React, { FC } from 'react'
import { getFluentIcon } from '../../../icons'
import { IFieldContainerProps } from '../types'
import styles from './IconLabel.module.scss'

export const IconLabel: FC<IFieldContainerProps> = (props) => {
  return (
    <div className={styles.iconLabel}>
      {getFluentIcon(props.iconName)}
      <Label weight='semibold' required={props.required}>
        <Text size={200} weight='semibold'>
          {props.label}
        </Text>
      </Label>
    </div>
  )
}
