import React, { FC } from 'react'
import { usePortfolioOverviewContext } from '../context'
import styles from './ResultsCount.module.scss'
import strings from 'PortfolioWebPartsStrings'
import { format } from '@fluentui/react'

export const ResultsCount: FC<{ displayCount: number }> = (props) => {
  const context = usePortfolioOverviewContext()
  return (
    <div className={styles.resultsCount}>
      {format(strings.ResultsCountLabel, props.displayCount, context.state?.items?.length)}
    </div>
  )
}
