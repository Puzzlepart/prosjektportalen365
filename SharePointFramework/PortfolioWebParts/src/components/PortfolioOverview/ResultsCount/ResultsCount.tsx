import React, { FC } from 'react'
import { usePortfolioOverviewContext } from '../context'
import styles from './ResultsCount.module.scss'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'

/**
 * How many of the view's projects are shown: a status, read out as a search or a filter changes
 * the count, and as the projects load (WCAG 4.1.3).
 */
export const ResultsCount: FC<{ displayCount: number }> = (props) => {
  const context = usePortfolioOverviewContext()
  if (!context) return null
  return (
    <div className={styles.resultsCount} role='status' aria-atomic>
      {format(strings.ResultsCountLabel, props.displayCount, context.state?.items?.length)}
    </div>
  )
}
