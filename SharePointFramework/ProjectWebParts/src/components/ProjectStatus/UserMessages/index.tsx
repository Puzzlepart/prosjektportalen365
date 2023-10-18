import { Shimmer } from '@fluentui/react'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { useProjectStatusContext } from '../context'
import styles from './UserMessages.module.scss'

export const UserMessages: FC = () => {
  const context = useProjectStatusContext()
  return (
    <Shimmer isDataLoaded={context.state.isDataLoaded}>
      <div className={styles.root}>
        {context.state.userMessage && <UserMessage {...context.state.userMessage} />}
      </div>
    </Shimmer>
  )
}
