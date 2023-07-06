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
  const initialState = useMemo(() => getInitialState(props), [props])
  const reducer = useMemo(() => createPortfolioAggregationReducer(props, initialState), [])
  const [state, dispatch] = useReducer(reducer, initialState)
  return useMemo<IPortfolioAggregationContext>(
    () => ({ props, state, dispatch, layerHostId }),
    [state]
  )
}

export * from './actions'
