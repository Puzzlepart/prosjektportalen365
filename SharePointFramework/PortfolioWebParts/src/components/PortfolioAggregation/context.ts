import { UnknownAction } from '@reduxjs/toolkit'
import { createContext, Dispatch, useContext } from 'react'
import { IListGroup } from '../List'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'

/**
 * Represents the context object for the Portfolio Aggregation component.
 */
export interface IPortfolioAggregationContext extends Pick<
  IPortfolioAggregationState,
  'items' | 'columns'
> {
  props: IPortfolioAggregationProps
  state: IPortfolioAggregationState
  dispatch: Dispatch<UnknownAction>
  layerHostId: string

  /**
   * Groups of `items` when the list is grouped, made from the items it shows.
   */
  groups?: IListGroup[]
}

export const PortfolioAggregationContext = createContext<IPortfolioAggregationContext>(null)

/**
 * A hook that returns the current value of the PortfolioAggregationContext.
 *
 * @returns The current value of the PortfolioAggregationContext.
 */
export const usePortfolioAggregationContext = () => useContext(PortfolioAggregationContext)
