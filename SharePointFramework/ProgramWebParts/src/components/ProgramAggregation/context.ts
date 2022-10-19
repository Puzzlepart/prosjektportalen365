import { AnyAction } from '@reduxjs/toolkit'
import { createContext, Dispatch } from 'react'
import { IProgramAggregationProps, IProgramAggregationState } from './types'

export interface IProgramAggregationContext {
  props: IProgramAggregationProps
  state: IProgramAggregationState
  dispatch: Dispatch<AnyAction>
}

export const ProgramAggregationContext = createContext<IProgramAggregationContext>(null)
