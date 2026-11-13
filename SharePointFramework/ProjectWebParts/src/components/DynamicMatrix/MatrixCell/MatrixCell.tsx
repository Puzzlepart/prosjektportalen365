import { getReadableTextColor } from 'pp365-shared-library/lib/util'
import React, { FC } from 'react'
import styles from './MatrixCell.module.scss'
import { IMatrixCellProps } from './types'

/**
 * Renders a colored matrix cell containing its uncertainty elements. Its zone is in text as well
 * as in its colour (WCAG 1.4.1): its level in a corner («3», or the name the configuration gives
 * it), in black or white as reads on the colour; its name read first by a screen reader, before
 * the elements, and shown in the cell's tooltip; and the colour itself stays in Windows contrast
 * themes, where it would give way to the theme's background.
 */
export const MatrixCell: FC<IMatrixCellProps> = (props) => {
  const color = props.cell.backgroundColor
  return (
    <div
      className={styles.matrixCell}
      style={{ backgroundColor: color, ...props.style }}
      role='cell'
      title={props.zone?.name}
    >
      {props.zone && (
        <span
          className={styles.mark}
          style={{ color: color ? getReadableTextColor(color, '#242424') : undefined }}
          aria-hidden
        >
          {props.zone.mark}
        </span>
      )}
      <div className={styles.cell}>
        {props.zone && <span className={styles.zone}>{props.zone.name}</span>}
        <span>{props.children}</span>
      </div>
    </div>
  )
}
