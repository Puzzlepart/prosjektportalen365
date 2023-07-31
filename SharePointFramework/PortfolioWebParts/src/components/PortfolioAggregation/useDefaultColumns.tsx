import _ from 'lodash'
import { useMemo } from 'react'
import { IPortfolioAggregationContext } from './context'

/**
 * Get default columns that should be included if the property `lockedColumns` is not
 * set to `true` in the web part properties, or if the data source level is set to
 * `Prosjekt`. An empty array is returned in these cases.
 *
 * In the future the `SiteTitle` column should be in the list _Prosjektinnholdskolonner_,
 * instead of hard coded here.
 *
 * @param props Props
 */
export function useDefaultColumns(context: IPortfolioAggregationContext) {
  const selectedColumns = useMemo(
    () => _.filter([...context.state.columns], (c) => c.data?.isSelected),
    [context.state.columns]
  )
  return selectedColumns
}
