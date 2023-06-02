import { TooltipHost } from '@fluentui/react'
import { ConditionalWrapper } from 'pp365-shared-library/lib/components'
import React, { FC, ReactNode, useContext } from 'react'
import { SectionContext } from '../Sections/context'
import styles from './StatusElement.module.scss'
import { StatusElementIcon } from './StatusElementIcon'
import { IStatusElementProps } from './types'
import { useStatusElement } from './useStatusElement'

export const StatusElement: FC<IStatusElementProps> = (props) => {
  const { headerProps } = useContext(SectionContext)
  const { commentProps, iconSize } = useStatusElement(props)
  return (
    <ConditionalWrapper
      condition={!!props.truncateComment || props.iconsOnly}
      wrapper={(children: ReactNode) => (
        <TooltipHost
          styles={{ root: { cursor: 'pointer' } }}
          content={
            <div className={styles.tooltip}>
              <StatusElement />
            </div>
          }>
          {children}
        </TooltipHost>
      )}>
      {props.iconsOnly ? (
        <StatusElementIcon iconSize={iconSize} />
      ) : (
        <div className={styles.root}>
          <div className={styles.container}>
            <StatusElementIcon iconSize={iconSize} />
            <div className={styles.content}>
              <div className={styles.label}>{headerProps.label}</div>
              <div className={styles.value}>{headerProps.value}</div>
              <div {...commentProps}></div>
            </div>
          </div>
        </div>
      )}
    </ConditionalWrapper>
  )
}
