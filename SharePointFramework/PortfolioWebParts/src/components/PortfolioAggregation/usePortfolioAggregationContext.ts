import { useContext } from 'react'
import { PortfolioAggregationContext } from './context'

/**
 * A custom hook that returns the current value of the `PortfolioAggregationContext`.
 *
 * @returns The current value of the `PortfolioAggregationContext`.
 */
export function usePortfolioAggregationContext() {
  const context = useContext(PortfolioAggregationContext)
  return context
}
