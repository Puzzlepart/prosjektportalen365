import React, { FC } from 'react'
import styles from './MatrixRow.module.scss'
import { IMatrixRowProps } from './types'

export const MatrixRow: FC<IMatrixRowProps> = (props) => {
  return <tr className={styles.root}>{props.children}</tr>
}
