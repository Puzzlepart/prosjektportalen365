import { stringIsNullOrEmpty } from '@pnp/core'
import React, { FC } from 'react'
import { IConfigColumnProps } from './types'
import { Tooltip } from '@fluentui/react-components'
import { getFluentIconWithFallback } from 'pp365-shared-library'
import styles from './ConfigColumn.module.scss'

export const ConfigColumn: FC<IConfigColumnProps> = (props) => {
  const element = (
    <span>
      <span className={styles.icon}>
        {getFluentIconWithFallback(props.iconName, { bundle: false, color: props.color })}
      </span>
      <span>{props.columnValue}</span>
    </span>
  )

  const tooltipValue: string = props.item[props.tooltipColumnPropertyName]

  if (!stringIsNullOrEmpty(tooltipValue)) {
    return (
      <Tooltip content={tooltipValue} relationship='label' withArrow>
        {element}
      </Tooltip>
    )
  } else {
    return element
  }
}

ConfigColumn.defaultProps = {
  tooltipColumnPropertyName: null
}
