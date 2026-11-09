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
      {/* The report's state beside the web part's title, not a second title (WCAG 1.3.1). */}
      {context.state.reportStatus && (
        <p className={styles.reportStatus}>{context.state.reportStatus}</p>
      )}
    </div>
  )
}
