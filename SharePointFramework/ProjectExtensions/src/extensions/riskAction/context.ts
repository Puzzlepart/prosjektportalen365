import { createContext, useContext } from 'react'
import { DataAdapter } from './dataAdapter'
import { RiskActionItemContext } from './types'

/** Data access and initial risk-item values supplied by the field customizer. */
export interface IRiskActionFieldCustomizerContext {
  dataAdapter: DataAdapter

  itemContext: RiskActionItemContext
}

/** Supplies each risk cell with its SharePoint and Planner data access. */
export const RiskActionFieldCustomizerContext =
  createContext<IRiskActionFieldCustomizerContext>(null)

/** Reads the field customizer's data adapter and initial item values. */
export const useRiskActionFieldCustomizerContext = () =>
  useContext(RiskActionFieldCustomizerContext)
