import strings from 'ProjectWebPartsStrings'
import { WebPartTitle } from 'pp365-shared-library'
import React, { FC } from 'react'
import { useProjectStatusContext } from '../context'
import styles from '../ProjectStatus.module.scss'
import { CheckmarkSquare24Filled } from '@fluentui/react-icons'

export const PublishedStatus: FC = () => {
  const { state } = useProjectStatusContext()
  return (
    <div className={styles.publishedStatus}>
      <div className={styles.publishedStatusIcon} hidden={!state.selectedReport?.published}>
        <CheckmarkSquare24Filled />
      </div>
      <WebPartTitle
        title={
          state.selectedReport?.published
            ? strings.PublishedStatusReport
            : strings.NotPublishedStatusReport
        }
      />
    </div>
  )
}