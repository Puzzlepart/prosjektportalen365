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
  const { commentProps, iconSize, useWrapper } = useStatusElement(props)
  return (
    <ConditionalWrapper
      condition={useWrapper}
      wrapper={(children: ReactNode) => (
        <TooltipHost // TODO: Use new Tooltip component here
          content={
            <div className={styles.tooltipContent}>
              <StatusElement />
            </div>
          }
        >
          {children}
        </TooltipHost>
      )}
    >
      {props.iconsOnly ? (
        <StatusElementIcon iconSize={iconSize} />
      ) : (
        <div className={styles.element}>
          <div className={styles.header}>
            <StatusElementIcon iconSize={iconSize} />
            <div className={styles.content}>
              <div className={styles.label}>{headerProps.label}</div>
              <div className={styles.value}>{headerProps.value}</div>
            </div>
          </div>
          <div {...commentProps}></div>
        </div>
      )}
    </ConditionalWrapper>
  )
}
