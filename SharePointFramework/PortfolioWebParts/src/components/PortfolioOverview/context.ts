import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'
import { ProjectColumn } from 'pp365-shared-library'
import { IGroup } from '@fluentui/react'

export interface IPortfolioOverviewContext {
  props: IPortfolioOverviewProps
  state: IPortfolioOverviewState
  dispatch: React.Dispatch<AnyAction>
  layerHostId: string
  items?: Record<string, any>[]
  columns?: ProjectColumn[]
  groups?: IGroup[]
}

export const PortfolioOverviewContext = createContext<IPortfolioOverviewContext>(null)
