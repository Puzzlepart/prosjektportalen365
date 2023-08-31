import React, { FC } from 'react'
import { Icon } from '@fluentui/react'
import styles from './Tooltip.module.scss'
import { Tooltip } from '@fluentui/react-components'
import { IInfoTooltipProps } from './types'


/**
 * Renders an informational tooltip with optional text and an icon.
 *
 * @param props - The props for the InfoTooltip component.
 *
 * @returns The rendered InfoTooltip component.
 */
export const InfoTooltip: FC<IInfoTooltipProps> = (props) => {
  if (!props.text) {
    return <>{props.children}</>
  }
  return (
    <Tooltip
      content={
        <>
          <p>{props.text}</p>
        </>
      }
      relationship='description'
      withArrow
    >
      <div className={styles.root}>
        {props.children}
        {props.iconProps && (
          <div>
            <Icon iconName='Info' className={styles.icon} />
          </div>
        )}
      </div>
    </Tooltip>
  )
}

export * from './types'
