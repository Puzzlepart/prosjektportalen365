import { ActionButton } from '@fluentui/react/lib/Button'
import React, { FC } from 'react'
import { IStatusOptionsProps } from './types'
import styles from './StatusOptions.module.scss'

export const StatusOptions: FC<IStatusOptionsProps> = ({ actions }) => {
  return (
    <div className={styles.root}>
      {actions.map((opt, key) => (
        <span key={key}>
          <ActionButton className={styles.action} {...opt} />
        </span>
      ))}
    </div>
  )
}
