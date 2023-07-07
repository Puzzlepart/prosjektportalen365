import { IGroup } from '@fluentui/react'
import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'

export interface IPortfolioOverviewContext {
  props: IPortfolioOverviewProps
  state: IPortfolioOverviewState
  dispatch: React.Dispatch<AnyAction>
  layerHostId: string
  items?: Record<string, any>[]
  groups?: IGroup[]
}

export const PortfolioOverviewContext = createContext<IPortfolioOverviewContext>(null)
