import { useMemo, useReducer } from 'react'
import { IPortfolioAggregationProps } from '../types'
import { createPortfolioAggregationReducer, initState } from './createPortfolioAggregationReducer'
import { IPortfolioAggregationContext } from '../context'

/**
 * Hook for the Portfolio Aggregation reducer. Returns the generated context
 * for the Portfolio Aggregation component.
 */
export const usePortfolioAggregationReducer = (
  props: IPortfolioAggregationProps
): IPortfolioAggregationContext => {
  const reducer = useMemo(() => createPortfolioAggregationReducer(props), [])
  const [state, dispatch] = useReducer(reducer, initState(props))
  const context = useMemo<IPortfolioAggregationContext>(() => ({ props, state, dispatch }), [state])
  return context
}

export * from './actions'
