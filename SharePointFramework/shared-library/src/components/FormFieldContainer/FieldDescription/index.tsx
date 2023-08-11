import React, { FC } from 'react'
import styles from './FieldDescription.module.scss'

export const FieldDescription: FC<{ description: string }> = ({ description }) => {
  return description && <div className={styles.root}>{description}</div>
}
