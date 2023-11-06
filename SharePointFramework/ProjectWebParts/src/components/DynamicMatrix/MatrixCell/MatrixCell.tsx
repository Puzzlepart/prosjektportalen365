import React, { FC } from 'react'
import styles from './MatrixCell.module.scss'
import { IMatrixCellProps } from './types'

export const MatrixCell: FC<IMatrixCellProps> = (props) => {
  return (
    <div className={styles.matrixCell} style={{ backgroundColor: props.cell.backgroundColor, ...props.style }}>
      <div className={styles.cell}>
        <span>{props.children}</span>
      </div>
    </div>
  )
}
