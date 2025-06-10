import { createContext, useContext } from 'react'
import { IProjectNewsProps, IProjectNewsState } from './types'

export interface IProjectNewsContext {
  props: IProjectNewsProps
  state: IProjectNewsState
  setState: (newState: Partial<IProjectNewsState>) => void
}

export const ProjectNewsContext = createContext<IProjectNewsContext>(null)

/**
 * Hook to get the `ProjectProvisionContext`
 */
export function useProjectNewsContext() {
  return useContext(ProjectNewsContext)
}
