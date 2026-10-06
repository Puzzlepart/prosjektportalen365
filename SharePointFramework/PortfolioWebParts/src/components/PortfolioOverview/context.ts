import { UnknownAction } from '@reduxjs/toolkit'
import { createContext, useContext } from 'react'
import { IListGroup } from '../List'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'

export interface IPortfolioOverviewContext {
  props: IPortfolioOverviewProps
  state: IPortfolioOverviewState
  dispatch: React.Dispatch<UnknownAction>
  layerHostId: string
  items?: Record<string, any>[]
  groups?: IListGroup[]
}

export const PortfolioOverviewContext = createContext<IPortfolioOverviewContext>(null)

/**
 * A hook that returns the current value of the `PortfolioOverviewContext`.
 *
 * @returns The current value of the `PortfolioOverviewContext`.
 */
export function usePortfolioOverviewContext() {
  const context = useContext(PortfolioOverviewContext)
  return context
}
