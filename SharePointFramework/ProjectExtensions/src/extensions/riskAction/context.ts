import { createContext, useContext } from 'react'
import { DataAdapter } from './dataAdapter'
import { RiskActionItemContext } from './types'

export interface IRiskActionFieldCustomizerContext {
  /**
   * The data adapter used to interact with the SharePoint list.
   */
  dataAdapter: DataAdapter

  /**
   * The context for the risk action item.
   */
  itemContext: RiskActionItemContext
}

export const RiskActionFieldCustomizerContext =
  createContext<IRiskActionFieldCustomizerContext>(null)

export const useRiskActionFieldCustomizerContext = () =>
  useContext(RiskActionFieldCustomizerContext)
