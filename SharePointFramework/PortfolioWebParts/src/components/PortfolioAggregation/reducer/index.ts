import { useId } from '@fluentui/react-hooks'
import { useMemo, useReducer } from 'react'
import { IPortfolioAggregationContext } from '../context'
import { IPortfolioAggregationProps } from '../types'
import { createPortfolioAggregationReducer } from './createPortfolioAggregationReducer'
import { getInitialState } from './getInitialState'

/**
 * Hook for the Portfolio Aggregation reducer. Returns the generated context
 * for the Portfolio Aggregation component.
 */
export const usePortfolioAggregationReducer = (
  props: IPortfolioAggregationProps
): IPortfolioAggregationContext => {
  const layerHostId = useId('layerHost')
  const reducer = useMemo(() => createPortfolioAggregationReducer(props), [])
  const [state, dispatch] = useReducer(reducer, getInitialState(props))
  const context = useMemo<IPortfolioAggregationContext>(
    () => ({ props, state, dispatch, layerHostId }),
    [state]
  )
  return context
}

export * from './actions'
