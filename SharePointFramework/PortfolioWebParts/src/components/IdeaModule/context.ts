import { createContext, useContext } from 'react'
import { IIdeaModuleProps, IIdeaModuleState } from './types'

export interface IIdeaModuleContext {
  props: IIdeaModuleProps
  state: IIdeaModuleState
  setState: (newState: Partial<IIdeaModuleState>) => void
}

export const IdeaModuleContext = createContext<IIdeaModuleContext>(null)

/**
 * Hook to get the `IdeaModuleContext`
 */
export function useIdeaModuleContext() {
  return useContext(IdeaModuleContext)
}
