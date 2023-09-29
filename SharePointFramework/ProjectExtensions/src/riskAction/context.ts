import { createContext, useContext } from 'react'
import { DataAdapter } from './dataAdapter'
import { IRiskActionFieldCustomizerItemContext } from './types'

export interface IRiskActionFieldCustomizerContext {
  /**
   * The data adapter used to interact with the SharePoint list.
   */
  dataAdapter: DataAdapter

  /**
   * The value of the field.
   */
  itemContext: IRiskActionFieldCustomizerItemContext
}

export const RiskActionFieldCustomizerContext =
  createContext<IRiskActionFieldCustomizerContext>(null)

export const useRiskActionFieldCustomizerContext = () => useContext(RiskActionFieldCustomizerContext)