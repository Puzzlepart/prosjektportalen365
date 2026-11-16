import React, { FC } from 'react'
import styles from './StatusReportLegend.module.scss'
import { IStatusReportLegendProps } from './types'
import { useStatusReportLegend } from './useStatusReportLegend'

/**
 * Two letters for each status section under the column's name, each above its tiles, so a column
 * of tiles can be followed down the rows by its section. Hidden from screen readers, who hear the
 * sections' names in each strip's description; the pointer shows the full name.
 */
export const StatusReportLegend: FC<IStatusReportLegendProps> = (props) => {
  const { entries, style } = useStatusReportLegend(props)
  return (
    <div className={styles.root} style={style} aria-hidden>
      {entries.map(({ key, name, abbreviation }) => (
        <span key={key} title={name}>
          {abbreviation}
        </span>
      ))}
    </div>
  )
}
