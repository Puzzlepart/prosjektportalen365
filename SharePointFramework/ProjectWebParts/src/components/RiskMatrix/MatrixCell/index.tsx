import React, { FC } from 'react'
import styles from './MatrixCell.module.scss'
import { IMatrixCellProps } from './types'
import { useMatrixCell } from './useMatrixCell'

export const MatrixCell: FC<IMatrixCellProps> = (props) => {
  const { backgroundColor } = useMatrixCell(props.cell)
  return (
    <div className={styles.root} style={{ backgroundColor, ...props.style }}>
      <div className={styles.container}>
        <span>{props.children}</span>
      </div>
    </div>
  )
}

export * from './MatrixHeaderCell'
export * from './types'
