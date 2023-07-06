import { AnyAction } from '@reduxjs/toolkit'
import { createContext, Dispatch } from 'react'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'

export interface IPortfolioAggregationContext
  extends Pick<IPortfolioAggregationState, 'items' | 'columns'> {
  props: IPortfolioAggregationProps
  state: IPortfolioAggregationState
  dispatch: Dispatch<AnyAction>
  layerHostId: string
}

export const PortfolioAggregationContext = createContext<IPortfolioAggregationContext>(null)
