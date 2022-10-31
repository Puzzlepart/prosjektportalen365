import { Shimmer } from '@fluentui/react'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { any } from 'underscore'
import { ProjectStatusContext } from '../context'
import styles from './UnpublishedStatusReportInfo.module.scss'

export const UnpublishedStatusReportInfo: FC = () => {
  const context = useContext(ProjectStatusContext)
  return (
    <Shimmer isDataLoaded={context.state.isDataLoaded}>
      <div className={styles.root}>
        {any(context.state.data.reports, (report) => !report.published) && (
          <UserMessage text={strings.UnpublishedStatusReportInfo} />
        )}
      </div>
    </Shimmer>
  )
}
