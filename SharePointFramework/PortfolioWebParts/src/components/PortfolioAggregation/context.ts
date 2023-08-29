import { AnyAction } from '@reduxjs/toolkit'
import { createContext, Dispatch, useContext } from 'react'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'

/**
 * Represents the context object for the Portfolio Aggregation component.
 */
export interface IPortfolioAggregationContext
  extends Pick<IPortfolioAggregationState, 'items' | 'columns'> {
  props: IPortfolioAggregationProps
  state: IPortfolioAggregationState
  dispatch: Dispatch<AnyAction>
  layerHostId: string
}

export const PortfolioAggregationContext = createContext<IPortfolioAggregationContext>(null)

/**
 * A hook that returns the current value of the PortfolioAggregationContext.
 * 
 * @returns The current value of the PortfolioAggregationContext.
 */
export const usePortfolioAggregationContext = () => useContext(PortfolioAggregationContext)