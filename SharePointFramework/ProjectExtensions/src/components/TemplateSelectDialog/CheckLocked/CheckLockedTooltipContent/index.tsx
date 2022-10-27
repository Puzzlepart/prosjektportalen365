import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FC } from 'react'
import { ICheckLockedTooltipContent } from './types'
import styles from './CheckLockedTooltipContent.module.scss'
import { Icon } from '@fluentui/react'

export const CheckLockedTooltipContent: FC<ICheckLockedTooltipContent> = (props) => {
  if (stringIsNullOrEmpty(props.tooltipText)) return null
  return (
    <div className={styles.root}>
      <Icon className={styles.icon} {...props.iconProps} />
      <span>{props.tooltipText}</span>
    </div>
  )
}

CheckLockedTooltipContent.defaultProps = {
  iconProps: { iconName: 'Lock' }
}
