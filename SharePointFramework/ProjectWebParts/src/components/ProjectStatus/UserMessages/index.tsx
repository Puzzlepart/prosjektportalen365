import { Shimmer } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { any } from 'underscore'
import { useProjectStatusContext } from '../context'
import styles from './UserMessages.module.scss'

export const UserMessages: FC = () => {
  const context = useProjectStatusContext()
  return (
    <Shimmer isDataLoaded={context.state.isDataLoaded}>
      <div className={styles.root}>
        {any(context.state.data.reports, (report) => !report.published) && (
          <UserMessage text={strings.UnpublishedStatusReportInfo} />
        )}
        {context.state.userMessage && <UserMessage {...context.state.userMessage} />}
      </div>
    </Shimmer>
  )
}
