import { useEffect } from 'react'
import { SET_CURRENT_VIEW, usePortfolioAggregationReducer } from './reducer'
import { IPortfolioAggregationProps } from './types'
import { useDefaultColumns } from './useDefaultColumns'
import { usePortfolioAggregationDataFetch } from './usePortfolioAggregationDataFetch'
import { usePortfolioAggregationFilteredItems } from './usePortfolioAggregationFilteredItems'

/**
 * Component logic hook for the Portfolio Aggregation component. This
 * hook is responsible for fetching data, managing state and dispatching
 * actions to the reducer.
 *
 * @param props Props for the Portfolio Aggregation component
 */
export const usePortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const context = usePortfolioAggregationReducer(props)

  useEffect(() => {
    if (props.dataSourceCategory) {
      context.dispatch(SET_CURRENT_VIEW)
    }
  }, [props.dataSourceCategory, props.defaultViewId])

  usePortfolioAggregationDataFetch(context, [context.state.currentView])

  context.items = usePortfolioAggregationFilteredItems(context)
  context.columns = useDefaultColumns(context)

  return context
}
