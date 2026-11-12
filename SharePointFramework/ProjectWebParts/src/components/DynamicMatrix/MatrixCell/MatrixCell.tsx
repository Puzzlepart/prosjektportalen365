import React, { FC } from 'react'
import styles from './MatrixCell.module.scss'
import { IMatrixCellProps } from './types'

/**
 * Renders a colored matrix cell containing its uncertainty elements. Its zone is in text as well
 * as in its colour (WCAG 1.4.1): read first by a screen reader, before the elements, and shown in
 * the cell's tooltip; and the colour itself stays in Windows contrast themes, where it would give
 * way to the theme's background.
 */
export const MatrixCell: FC<IMatrixCellProps> = (props) => {
  return (
    <div
      className={styles.matrixCell}
      style={{ backgroundColor: props.cell.backgroundColor, ...props.style }}
      role='cell'
      title={props.zone}
    >
      <div className={styles.cell}>
        {props.zone && <span className={styles.zone}>{props.zone}</span>}
        <span>{props.children}</span>
      </div>
    </div>
  )
}
