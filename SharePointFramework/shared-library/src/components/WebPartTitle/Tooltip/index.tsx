import React, { FC } from 'react'
import { ITooltipProps } from './types'
import { Icon, TooltipHost } from '@fluentui/react'
import styles from './Tooltip.module.scss'

/**
 * Renders a tooltip with optional text and an icon.
 *
 * @param props - The props for the Tooltip component.
 *
 * @returns The rendered Tooltip component.
 */
export const Tooltip: FC<ITooltipProps> = (props) => {
  if (!props.text) {
    return <>{props.children}</>
  }
  return (
    <TooltipHost
      content={
        <div>
          <p>{props.text}</p>
        </div>
      }
    >
      <div className={styles.root}>
        {props.children}
        {props.iconProps && (
          <div>
            <Icon iconName='Info' className={styles.icon} />
          </div>
        )}
      </div>
    </TooltipHost>
  )
}

export * from './types'
