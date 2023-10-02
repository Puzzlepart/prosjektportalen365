import React, { Dispatch, createContext, useContext } from 'react'
import { RiskActionItemContext } from '../../types'

interface IRiskActionContext {
  itemContext: RiskActionItemContext
  setItemContext: Dispatch<React.SetStateAction<RiskActionItemContext>>
}

export const RiskActionContext = createContext<IRiskActionContext>(null)

export const useRiskActionContext = () => useContext(RiskActionContext)
