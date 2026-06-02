import React, { FC } from 'react'
import styles from '../ArchiveOverview.module.scss'
import { ActivityLevel } from '../useArchiveData'

const BAR_HEIGHTS = [30, 60, 100, 65]

function getBarColor(level: ActivityLevel, barIdx: number): string {
  if (level === 'none') return '#C8C6C4'
  if (level === 'high') return '#107C10'
  if (level === 'medium') return barIdx < 3 ? '#107C10' : '#C8C6C4'
  if (level === 'low') return barIdx < 2 ? '#FFB900' : '#C8C6C4'
  return '#C8C6C4'
}

export const ActivityBars: FC<{ level: ActivityLevel }> = ({ level }) => (
  <div className={styles.activityBarsWrap}>
    {BAR_HEIGHTS.map((h, i) => (
      <div
        key={i}
        className={styles.activityBar}
        style={{ height: `${h}%`, backgroundColor: getBarColor(level, i) }}
      />
    ))}
  </div>
)
