import _ from 'lodash'
import { useMemo } from 'react'
import { IPortfolioAggregationContext } from './context'
import { ProjectContentColumn } from 'pp365-shared-library'

/**
 * Get default columns that should be included in the list view.
 *
 * @param context Context for the Portfolio Aggregation component
 */
export function useDefaultColumns(context: IPortfolioAggregationContext) {
  const selectedColumns: ProjectContentColumn[] = useMemo(
    () => _.filter([...context.state.columns], (c) => c.data?.isSelected || c.data?.isLocked),
    [context.state.columns]
  )
  return selectedColumns
}
