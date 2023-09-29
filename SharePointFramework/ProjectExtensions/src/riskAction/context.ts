import { createContext } from 'react'
import { DataAdapter } from './dataAdapter'

export interface IRiskActionFieldCustomizerContext {
  /**
   * The data adapter used to interact with the SharePoint list.
   */
  dataAdapter: DataAdapter
}

export const RiskActionFieldCustomizerContext =
  createContext<IRiskActionFieldCustomizerContext>(null)
