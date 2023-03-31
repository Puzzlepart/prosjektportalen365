import { createContext } from 'react'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from './types'

export interface IPortfolioOverviewContext {
    props: IPortfolioOverviewProps
    state: IPortfolioOverviewState
    layerHostId: string
}

export const PortfolioOverviewContext = createContext<IPortfolioOverviewContext>(null)