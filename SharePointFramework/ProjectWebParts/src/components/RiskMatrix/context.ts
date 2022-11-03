import { createContext } from 'react'
import { RiskElementModel, RiskMatrixConfiguration } from './types'

export interface IRiskMatrixContext {
  items?: RiskElementModel[]
  calloutTemplate: string
  configuration: RiskMatrixConfiguration
}

export const RiskMatrixContext = createContext<IRiskMatrixContext>(null)
