import { Icon, TooltipHost } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'
import React, { FC } from 'react'
import { IConfigColumnProps } from './types'
import styles from './ConfigColumn.module.scss'

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
      <TooltipHost
        content={<div className={styles.tooltipContent}>{tooltipValue}</div>}
        calloutProps={props.calloutProps}
      >
        {element}
      </TooltipHost>
    )
  } else {
    return element
  }
}

ConfigColumn.defaultProps = {
  tooltipColumnPropertyName: null,
  calloutProps: { gapSpace: 0 }
}
