import { IColumn } from '@fluentui/react'
import { AnyAction } from '@reduxjs/toolkit'
import { createContext, Dispatch } from 'react'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from './types'

export interface IPortfolioAggregationContext {
  props: IPortfolioAggregationProps
  state: IPortfolioAggregationState
  dispatch: Dispatch<AnyAction>
  layerHostId: string
  items?: Record<string, any>[]
  columns?: IColumn[]
}

export const PortfolioAggregationContext = createContext<IPortfolioAggregationContext>(null)
