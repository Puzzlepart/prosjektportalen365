import { useContext } from 'react'
import { PortfolioOverviewContext } from './context'

/**
 * A hook that returns the current value of the `PortfolioOverviewContext`.
 *
 * @returns The current value of the `PortfolioOverviewContext`.
 */
export function usePortfolioOverviewContext() {
  const context = useContext(PortfolioOverviewContext)
  return context
}
