import React, { FC } from 'react'
import styles from './MatrixHeaderCell.module.scss'
import { IMatrixHeaderCellProps } from './types'

export const MatrixHeaderCell: FC<IMatrixHeaderCellProps> = (props) => {
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <span>{props.text}</span>
      </div>
    </div>
  )
}

MatrixHeaderCell.defaultProps = {
  text: ''
}

export * from './types'
