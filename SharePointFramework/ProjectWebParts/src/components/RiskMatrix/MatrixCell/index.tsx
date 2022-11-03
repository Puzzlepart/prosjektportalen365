import React, { FC } from 'react'
import { IMatrixCellProps, IMatrixHeaderCellProps } from './types'
import styles from './MatrixCell.module.scss'

export const MatrixCell: FC<IMatrixCellProps> = (props) => {
  return (
    <td className={styles.root} style={props.style}>
      <div className={styles.container}>{props.children}</div>
    </td>
  )
}

export const MatrixHeaderCell: FC<IMatrixHeaderCellProps> = (props) => {
  return (
    <td className={`${styles.root} ${styles.headerCell}`}>
      <span>{props.label}</span>
    </td>
  )
}

export * from './types'
