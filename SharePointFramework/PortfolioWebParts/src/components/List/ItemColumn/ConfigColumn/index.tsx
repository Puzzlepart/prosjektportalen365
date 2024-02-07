import { Icon } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import React, { FC } from 'react'
import { IConfigColumnProps } from './types'
import { Tooltip } from '@fluentui/react-components'

export const ConfigColumn: FC<IConfigColumnProps> = (props) => {
  const element = (
    <span>
      <Icon iconName={props.iconName} style={{ color: props.color, marginRight: 4 }} />
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
