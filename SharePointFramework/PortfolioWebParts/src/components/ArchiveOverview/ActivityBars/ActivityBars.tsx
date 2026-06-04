import React, { FC } from 'react'
import styles from '../ArchiveOverview.module.scss'
import { ActivityLevel } from '../useArchiveData'

// All bars at the same height (the former maximum)
const BAR_HEIGHTS = [100, 100, 100, 100]

function getBarColor(level: ActivityLevel, barIdx: number): string {
  if (level === 'none') return 'rgba(200, 198, 196, 0.45)'
  if (level === 'high') return 'rgba(16, 124, 16, 0.60)'
  if (level === 'medium')
    return barIdx < 3 ? 'rgba(16, 124, 16, 0.60)' : 'rgba(200, 198, 196, 0.45)'
  if (level === 'low')
    return barIdx < 2 ? 'rgba(255, 185, 0, 0.65)' : 'rgba(200, 198, 196, 0.45)'
  return 'rgba(200, 198, 196, 0.45)'
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
