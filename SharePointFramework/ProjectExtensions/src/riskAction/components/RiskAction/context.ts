import React, { Dispatch, createContext, useContext } from 'react'
import { RiskActionItemContext } from '../../types'

/**
 * Represents the context for a Risk Action item.
 */
interface IRiskActionContext {
  /**
   * The item context for the Risk Action.
   */
  itemContext: RiskActionItemContext

  /**
   * Sets the item context for the Risk Action.
   *
   * @param value - The new value for the item context.
   */
  setItemContext: Dispatch<React.SetStateAction<RiskActionItemContext>>
}

export const RiskActionContext = createContext<IRiskActionContext>(null)

/**
 * A hook that returns the current `RiskActionContext` object.
 *
 * @returns The current `RiskActionContext` object.
 */
export const useRiskActionContext = () => useContext(RiskActionContext)
