import { stringIsNullOrEmpty } from '@pnp/common'
import React, { FC } from 'react'
import { IMandatoryCheckTooltipProps } from './types'
import styles from './MandatoryCheckTooltip.module.scss'
import { Icon } from '@fluentui/react'

export const MandatoryCheckTooltip: FC<IMandatoryCheckTooltipProps> = (
  props
) => {
  return !stringIsNullOrEmpty(props.text) ? (
    <div className={styles.root}>
      <div className={styles.icon}>
        <Icon {...props.iconProps} />
      </div>
      <div>{props.text}</div>
    </div>
  ) : null
}

MandatoryCheckTooltip.defaultProps = {
  iconProps: { iconName: 'Lock' }
}
