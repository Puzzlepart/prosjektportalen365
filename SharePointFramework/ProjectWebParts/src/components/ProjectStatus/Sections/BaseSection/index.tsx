import React, { FC, HTMLProps } from 'react'
import styles from './BaseSection.module.scss'

export const BaseSection: FC<HTMLProps<HTMLDivElement>> = ({ children }) => {
  return (
    <div className={styles.root}>
      <div className={styles.container}>{children}</div>
    </div>
  )
}
