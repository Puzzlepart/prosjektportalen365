import { createContext, useContext } from 'react'
import { IIdeaModuleProps, IIdeaModuleState } from './types'

/** Idea configuration, selection and shared state updates for descendant components. */
export interface IIdeaModuleContext {
  props: IIdeaModuleProps
  state: IIdeaModuleState
  setState: (newState: Partial<IIdeaModuleState>) => void
}

/** Shared state for the idea module's navigation, fields and commands. */
export const IdeaModuleContext = createContext<IIdeaModuleContext>(null)

/**
 * Hook to get the `IdeaModuleContext`
 */
export function useIdeaModuleContext() {
  return useContext(IdeaModuleContext)
}
