import { WebPartTitle } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useProjectStatusContext } from '../context'
import styles from '../ProjectStatus.module.scss'
import { CheckmarkSquare24Filled } from '@fluentui/react-icons'

export const PublishedStatus: FC = () => {
  const context = useProjectStatusContext()

  return (
    <div className={styles.publishedStatus}>
      {context.state.selectedReport?.published && (
        <div className={styles.publishedStatusIcon}>
          <CheckmarkSquare24Filled />
        </div>
      )}
      <WebPartTitle title={context.state.reportStatus} />
    </div>
  )
}
