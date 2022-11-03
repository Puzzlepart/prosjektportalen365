import React, { FC } from 'react'
import { IMatrixCellProps, IMatrixHeaderCellProps } from './types'
import styles from './MatrixCell.module.scss'

export const MatrixCell: FC<IMatrixCellProps> = (props) => {
  return (
    <div className={styles.root} style={props.style}>
      <div className={styles.container}>
        <span>{props.children}</span>
      </div>
    </div>
  )
}

export const MatrixHeaderCell: FC<IMatrixHeaderCellProps> = (props) => {
  return (
    <div className={`${styles.root} ${styles.headerCell}`}>
      <div className={styles.container}>
        <span>{props.label}</span>
      </div>
    </div>
  )
}

export * from './types'
