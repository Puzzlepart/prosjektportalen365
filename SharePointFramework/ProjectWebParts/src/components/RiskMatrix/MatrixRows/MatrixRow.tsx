import React, { FC, HTMLProps } from 'react'
import styles from './MatrixRow.module.scss'

export const MatrixRow: FC<HTMLProps<HTMLDivElement>> = (props) => {
  return <div className={styles.root}>{props.children}</div>
}
