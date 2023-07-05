import { getId } from '@fluentui/react'
import { useEffect } from 'react'
import { SET_CURRENT_VIEW, usePortfolioAggregationReducer } from './reducer'
import { IPortfolioAggregationProps } from './types'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { usePortfolioAggregationDataFetch } from './usePortfolioAggregationDataFetch'
import { usePortfolioAggregationDataSources } from './usePortfolioAggregationDataSources'
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
  const layerHostId = getId('layerHost')

  useEffect(() => {
    if (props.dataSourceCategory) {
      context.dispatch(SET_CURRENT_VIEW)
    }
  }, [props.dataSourceCategory, props.defaultViewId])

  usePortfolioAggregationDataSources(context)
  usePortfolioAggregationDataFetch(context)

  const items = usePortfolioAggregationFilteredItems(context)

  const editViewColumnsPanelProps = useEditViewColumnsPanel(context)

  return { context, items, layerHostId, editViewColumnsPanelProps } as const
}
