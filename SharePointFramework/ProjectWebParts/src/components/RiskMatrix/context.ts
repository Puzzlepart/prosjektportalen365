import { createContext } from 'react'
import { IRiskMatrixProps, RiskMatrixConfiguration } from './types'

export interface IRiskMatrixContext extends Pick<IRiskMatrixProps, 'items' | 'calloutTemplate'> {
  configuration: RiskMatrixConfiguration
  size: number
}

export const RiskMatrixContext = createContext<IRiskMatrixContext>(null)
