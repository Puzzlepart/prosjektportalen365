import React, { Dispatch, createContext, useContext } from 'react'
import { IRiskActionItemContext } from '../../types'

interface IRiskActionContext {
  itemContext: IRiskActionItemContext
  setItemContext: Dispatch<React.SetStateAction<IRiskActionItemContext>>
}

export const RiskActionContext = createContext<IRiskActionContext>(null)

export const useRiskActionContext = () => useContext(RiskActionContext)
