import { Shimmer } from '@fluentui/react'
import { ProjectStatusContext } from '../../../ProjectStatus/context'
import { conditionalClassName } from 'pp365-shared-library/lib/util'
import React, { FC, useContext } from 'react'
import styles from './BaseSection.module.scss'
import { IBaseSectionProps } from './types'

export const BaseSection: FC<IBaseSectionProps> = (props) => {
  const context = useContext(ProjectStatusContext)
  return (
    <div
      className={conditionalClassName([
        styles.root,
        props.transparent && styles.transparent,
        props.noPadding && styles.noPadding,
        props.noMargin && styles.noMargin
      ])}>
      <div className={styles.container}>
        <Shimmer isDataLoaded={context.state.isDataLoaded}>{props.children}</Shimmer>
      </div>
    </div>
  )
}

export * from './types'
