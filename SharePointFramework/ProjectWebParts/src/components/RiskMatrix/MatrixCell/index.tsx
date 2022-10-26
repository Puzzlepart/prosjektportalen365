import React, { FC } from 'react'
import { IMatrixCellProps } from './types'
import styles from './MatrixCell.module.scss'

export const MatrixCell: FC<IMatrixCellProps> = ({ style, children }: IMatrixCellProps) => {
  return (
    <td className={styles.matrixCell} style={style}>
      <div className={styles.container}>{children}</div>
    </td>
  )
}

export interface IMatrixHeaderCellProps extends React.HTMLProps<HTMLElement> {
  label: string
}

export const MatrixHeaderCell: FC<IMatrixHeaderCellProps> = (props: IMatrixHeaderCellProps) => {
  return (
    <td className={`${styles.matrixCell} ${styles.headerCell}`}>
      <span>{props.label}</span>
    </td>
  )
}

export * from './types'
