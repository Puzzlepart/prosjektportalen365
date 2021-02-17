import { AnyAction } from '@reduxjs/toolkit'
import { createContext, Dispatch } from 'react'
import { IPortfolioAggregationState } from './types'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPortfolioAggregationContext {
state: IPortfolioAggregationState
dispatch: Dispatch<AnyAction>
}

export const PortfolioAggregationContext = createContext<IPortfolioAggregationContext>(null)