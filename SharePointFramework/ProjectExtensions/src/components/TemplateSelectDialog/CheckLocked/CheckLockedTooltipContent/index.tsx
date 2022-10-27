import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FC } from 'react'
import { ICheckLockedTooltipContent } from './types'
import styles from './CheckLockedTooltipContent.module.scss'
import { Icon } from '@fluentui/react'

export const CheckLockedTooltipContent: FC<ICheckLockedTooltipContent> = (props) => {
  if (stringIsNullOrEmpty(props.text)) return null
  return (
    <div className={styles.root}>
      <div className={styles.icon}>
        <Icon  {...props.iconProps} />
      </div>
      <div>{props.text}</div>
    </div>
  )
}

CheckLockedTooltipContent.defaultProps = {
  iconProps: { iconName: 'Lock' }
}
