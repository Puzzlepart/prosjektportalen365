import { createContext, useContext } from 'react'
import { IProjectNewsProps, IProjectNewsState } from './types'

/** News configuration, loaded data and shared dialog state. */
export interface IProjectNewsContext {
  props: IProjectNewsProps
  state: IProjectNewsState
  setState: (newState: Partial<IProjectNewsState>) => void
}

/** Shares project news state with the list and creation dialog. */
export const ProjectNewsContext = createContext<IProjectNewsContext>(null)

/**
 * Hook to get the `ProjectNewsContext`
 */
export function useProjectNewsContext() {
  return useContext(ProjectNewsContext)
}
