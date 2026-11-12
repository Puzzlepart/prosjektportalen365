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
   * Id of the toaster that tells the user an Excel export failed.
   */
  toasterId: string

  /**
   * Groups of `items` when the list is grouped, made from the items it shows.
   */
  groups?: IListGroup[]
}

/** Aggregation state and actions shared with commands, menus and editing panels. */
export const PortfolioAggregationContext = createContext<IPortfolioAggregationContext>(null)

/**
 * Read the aggregation's shared state and actions.
 */
export const usePortfolioAggregationContext = () => useContext(PortfolioAggregationContext)
