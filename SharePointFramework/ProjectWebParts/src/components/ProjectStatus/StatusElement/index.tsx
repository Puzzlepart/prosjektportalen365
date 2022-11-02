import { Icon } from '@fluentui/react/lib/Icon'
import React, { FC, useContext } from 'react'
import { SectionContext } from '../Sections/context'
import styles from './StatusElement.module.scss'
import { IStatusElementProps } from './types'
import { useStatusElement } from './useStatusElement'

export const StatusElement: FC<IStatusElementProps> = (props) => {
  const { headerProps } = useContext(SectionContext)
  const { commentProps } = useStatusElement(props)
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div
          className={styles.icon}
          style={{
            fontSize: props.iconSize ?? headerProps.iconSize,
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
  )
}
