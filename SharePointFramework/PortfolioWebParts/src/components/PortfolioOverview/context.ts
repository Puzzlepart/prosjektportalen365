import { UnknownAction } from '@reduxjs/toolkit'
import { createContext, useContext } from 'react'
import { IListGroup } from '../List'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'

/** Overview state, actions, filtered rows and overlay identifiers shared with descendants. */
export interface IPortfolioOverviewContext {
  props: IPortfolioOverviewProps
  state: IPortfolioOverviewState
  dispatch: React.Dispatch<UnknownAction>
  layerHostId: string

  /**
   * Id of the toaster that tells the user an Excel export failed.
   */
  toasterId: string
  items?: Record<string, any>[]
  groups?: IListGroup[]
}

/** Shared state and actions for the portfolio overview and its editing surfaces. */
export const PortfolioOverviewContext = createContext<IPortfolioOverviewContext>(null)

/**
 * Read the portfolio overview's shared state and actions.
 */
export function usePortfolioOverviewContext() {
  const context = useContext(PortfolioOverviewContext)
  return context
}
