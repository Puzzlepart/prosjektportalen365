import { createContext, useContext } from 'react'
import { IIdeaModuleProps, IIdeaModuleState } from './types'

export interface IIdeaModuleContext {
  props: IIdeaModuleProps
  state: IIdeaModuleState
  setState: (newState: Partial<IIdeaModuleState>) => void
}

export const IdeaModuleContext = createContext<IIdeaModuleContext>(null)

/**
 * Hook to get the `ProjectProvisionContext`
 */
export function useProjectProvisionContext() {
  return useContext(IdeaModuleContext)
}
