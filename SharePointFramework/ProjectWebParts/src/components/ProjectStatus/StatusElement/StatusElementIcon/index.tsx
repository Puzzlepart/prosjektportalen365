import { Icon } from '@fluentui/react/lib/Icon'
import { SectionContext } from 'components/ProjectStatus/Sections/context'
import React, { FC, useContext } from 'react'
import { IStatusElementIconProps } from './types'
import styles from './StatusElementIcon.module.scss'

export const StatusElementIcon: FC<IStatusElementIconProps> = (props) => {
  const { headerProps } = useContext(SectionContext)
  return (
    <div
      className={styles.root}
      style={{
        fontSize: props.iconSize,
        color: headerProps.iconColor
      }}>
      <Icon iconName={headerProps.iconName} />
    </div>
  )
}
