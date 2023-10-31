import React, { FC } from 'react'
import { IStatusActionsProps } from './types'
import styles from './StatusActions.module.scss'
import { Button } from '@fluentui/react-components'

export const StatusActions: FC<IStatusActionsProps> = ({ actions }) => {
  return (
    <div className={styles.root}>
      {actions.map((action, index) => (
        <Button
          className={styles.button}
          appearance='subtle'
          title={action.text}
          key={index}
          {...action}
        >
          {action.text}
        </Button>
      ))}
    </div>
  )
}
