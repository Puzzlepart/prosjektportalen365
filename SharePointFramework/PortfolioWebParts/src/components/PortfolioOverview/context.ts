import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'

export interface IPortfolioOverviewContext {
  props: IPortfolioOverviewProps
  state: IPortfolioOverviewState
  dispatch: React.Dispatch<AnyAction>
  layerHostId: string
}

export const PortfolioOverviewContext = createContext<IPortfolioOverviewContext>(null)
