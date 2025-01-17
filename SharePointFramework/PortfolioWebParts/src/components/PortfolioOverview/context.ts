import { IGroup } from '@fluentui/react'
import { AnyAction } from '@reduxjs/toolkit'
import { createContext, useContext } from 'react'
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


/**
 * A hook that returns the current value of the `PortfolioOverviewContext`.
 *
 * @returns The current value of the `PortfolioOverviewContext`.
 */
export function usePortfolioOverviewContext() {
  const context = useContext(PortfolioOverviewContext)
  return context
}
