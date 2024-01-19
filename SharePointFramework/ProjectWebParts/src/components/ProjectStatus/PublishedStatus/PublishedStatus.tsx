import strings from 'ProjectWebPartsStrings'
import { WebPartTitle } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useProjectStatusContext } from '../context'
import styles from '../ProjectStatus.module.scss'
import { CheckmarkSquare24Filled } from '@fluentui/react-icons'
import { Shimmer } from '@fluentui/react'

export const PublishedStatus: FC = () => {
  const { state } = useProjectStatusContext()

  return (
    <Shimmer isDataLoaded={state.isDataLoaded}>
      {state.selectedReport?.published ? (
        <div className={styles.publishedStatus}>
          <div className={styles.publishedStatusIcon}>
            <CheckmarkSquare24Filled />
          </div>
          <WebPartTitle title={strings.PublishedStatusReport} />
        </div>
      ) : (
        <div className={styles.publishedStatus}>
          <WebPartTitle title={strings.NotPublishedStatusReport} />
        </div>
      )}
    </Shimmer>
  )
}
