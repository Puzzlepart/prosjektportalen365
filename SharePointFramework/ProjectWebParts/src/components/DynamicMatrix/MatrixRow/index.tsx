import React, { FC, HTMLProps } from 'react'
import styles from './MatrixRow.module.scss'

/** Groups matrix cells into an accessible table row. */
export const MatrixRow: FC<HTMLProps<HTMLDivElement>> = (props) => {
  return (
    <div className={styles.root} role='row'>
      {props.children}
    </div>
  )
}
