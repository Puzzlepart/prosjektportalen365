import { conditionalClassName } from 'pp365-shared-library/lib/util'
import React, { FC, useContext } from 'react'
import { useProjectStatusContext } from '../../../ProjectStatus/context'
import styles from './BaseSection.module.scss'
import { IBaseSectionProps } from './types'
import { SectionContext } from '../context'
import { LoadingSkeleton } from 'pp365-shared-library'

export const BaseSection: FC<IBaseSectionProps> = (props) => {
  const context = useProjectStatusContext()
  const { section } = useContext(SectionContext) || {}

  return (
    <div
      id={`seksjon${section?.id}`}
      className={conditionalClassName([
        styles.baseSection,
        props.transparent && styles.transparent,
        props.noPadding && styles.noPadding,
        props.noMargin && styles.noMargin
      ])}
    >
      <div className={styles.container}>
        {context.state.isDataLoaded ? props.children : <LoadingSkeleton />}
      </div>
    </div>
  )
}
