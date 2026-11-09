import React, { FC } from 'react'
import { IStatusSectionFieldProps } from './types'
import styles from './StatusSectionField.module.scss'

export const StatusSectionField: FC<IStatusSectionFieldProps> = (props) => {
  return (
    <div className={styles.statusSectionField}>
      <dt className={styles.label}>{props.label}</dt>
      <dd className={styles.value}>{props.value}</dd>
    </div>
  )
}

StatusSectionField.displayName = 'StatusSectionField'
