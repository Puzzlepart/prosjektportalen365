import { AnyAction } from '@reduxjs/toolkit'
import { createContext, Dispatch } from 'react'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'

export interface IPortfolioAggregationContext {
  props: IPortfolioAggregationProps
  state: IPortfolioAggregationState
  dispatch: Dispatch<AnyAction>
}

export const PortfolioAggregationContext =
  createContext<IPortfolioAggregationContext>(null)
