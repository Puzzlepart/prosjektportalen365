import React, { Dispatch, createContext, useContext } from 'react'
import { RiskActionItemContext } from '../../extensions/riskAction/types'

/**
 * Represents the context for a Risk Action item.
 */
interface IRiskActionContext {
  itemContext: RiskActionItemContext

  setItemContext: Dispatch<React.SetStateAction<RiskActionItemContext>>
}

/** Shares the current risk item and its updates between task controls. */
export const RiskActionContext = createContext<IRiskActionContext>(null)

/** Reads the current risk item and its update callback. */
export const useRiskActionContext = () => useContext(RiskActionContext)
