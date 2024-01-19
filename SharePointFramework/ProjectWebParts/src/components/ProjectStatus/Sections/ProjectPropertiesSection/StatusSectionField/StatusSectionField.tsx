import React, { FC } from 'react'
import { IStatusSectionFieldProps } from './types'
import styles from './StatusSectionField.module.scss'

export const StatusSectionField: FC<IStatusSectionFieldProps> = (props) => {
  return (
    <div className={styles.statusSectionField}>
      <div className={styles.label}>{props.label}</div>
      <div className={styles.value}>{props.value}</div>
    </div>
  )
}

StatusSectionField.displayName = 'StatusSectionField'
