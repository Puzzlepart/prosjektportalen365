import React from 'react'
import { IStatusSectionFieldProps } from './types'
import styles from './StatusSectionField.module.scss'

export const StatusSectionField = ({ label, value, width }: IStatusSectionFieldProps) => {
  return (
    <div className={styles.statusSectionField} style={{ width: width || 250 }}>
      <div className={styles.statusSectionFieldInner}>
        <div className={styles.statusSectionFieldLabel}>{label}</div>
        <div className={styles.statusSectionFieldValue}>{value}</div>
      </div>
    </div>
  )
}
