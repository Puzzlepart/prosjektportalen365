import { conditionalClassName } from 'pp365-shared-library/lib/util'
import { LoadingSkeleton } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import strings from 'ProjectWebPartsStrings'
import { useProjectStatusContext } from '../../../ProjectStatus/context'
import { SectionContext } from '../context'
import styles from './BaseSection.module.scss'
import { IBaseSectionProps } from './types'

export const BaseSection: FC<IBaseSectionProps> = (props) => {
  const context = useProjectStatusContext()
  const { section } = useContext(SectionContext) || {}

  return (
    <div
      id={`${strings.ListSectionElementIdPrefix}${section?.id}`}
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
