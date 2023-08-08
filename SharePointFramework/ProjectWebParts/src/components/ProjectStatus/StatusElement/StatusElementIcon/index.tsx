import { Icon } from '@fluentui/react/lib/Icon'
import React, { FC, useContext } from 'react'
import { SectionContext } from '../../../ProjectStatus/Sections/context'
import styles from './StatusElementIcon.module.scss'
import { IStatusElementIconProps } from './types'

export const StatusElementIcon: FC<IStatusElementIconProps> = (props) => {
  const { headerProps } = useContext(SectionContext)
  return (
    <div
      className={styles.root}
      style={{
        fontSize: props.iconSize,
        color: headerProps.iconColor
      }}
    >
      <Icon iconName={headerProps.iconName} />
    </div>
  )
}
