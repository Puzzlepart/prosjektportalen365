import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import React, { FC } from 'react'
import { useProjectStatusContext } from '../context'
import styles from './UserMessages.module.scss'
import { LoadingSkeleton } from 'pp365-shared-library'

export const UserMessages: FC = () => {
  const context = useProjectStatusContext()
  return context.state.isDataLoaded ? (
    <div className={styles.userMessages}>
      {context.state.userMessage && <UserMessage {...context.state.userMessage} />}
    </div>
  ) : (
    <LoadingSkeleton />
  )
}
