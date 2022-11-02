import { TooltipHost } from '@fluentui/react'
import { Icon } from '@fluentui/react/lib/Icon'
import { ConditionalWrapper } from 'pp365-shared/lib/components'
import React, { FC, ReactNode, useContext } from 'react'
import { SectionContext } from '../Sections/context'
import styles from './StatusElement.module.scss'
import { IStatusElementProps } from './types'
import { useStatusElement } from './useStatusElement'

export const StatusElement: FC<IStatusElementProps> = (props) => {
  const { headerProps } = useContext(SectionContext)
  const { commentProps, iconSize } = useStatusElement(props)
  return (
    <ConditionalWrapper
      condition={!!props.truncateComment}
      wrapper={(children: ReactNode) => (
        <TooltipHost
          content={
            <div className={styles.tooltip}>
              <StatusElement />
            </div>
          }>
          {children}
        </TooltipHost>
      )}>
      <div className={styles.root}>
        <div className={styles.container}>
          <div
            className={styles.icon}
            style={{
              fontSize: iconSize,
              color: headerProps.iconColor
            }}>
            <Icon iconName={headerProps.iconName} />
          </div>
          <div className={styles.content}>
            <div className={styles.label}>{headerProps.label}</div>
            <div className={styles.value}>{headerProps.value}</div>
            <div {...commentProps}></div>
          </div>
        </div>
      </div>
    </ConditionalWrapper>
  )
}
