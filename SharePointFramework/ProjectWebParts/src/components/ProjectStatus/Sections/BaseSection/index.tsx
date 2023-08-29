import { Shimmer } from '@fluentui/react'
import { conditionalClassName } from 'pp365-shared-library/lib/util'
import React, { FC } from 'react'
import { useProjectStatusContext } from '../../../ProjectStatus/context'
import styles from './BaseSection.module.scss'
import { IBaseSectionProps } from './types'

export const BaseSection: FC<IBaseSectionProps> = (props) => {
  const context = useProjectStatusContext()
  return (
    <div
      className={conditionalClassName([
        styles.root,
        props.transparent && styles.transparent,
        props.noPadding && styles.noPadding,
        props.noMargin && styles.noMargin
      ])}
    >
      <div className={styles.container}>
        <Shimmer isDataLoaded={context.state.isDataLoaded}>{props.children}</Shimmer>
      </div>
    </div>
  )
}

export * from './types'
