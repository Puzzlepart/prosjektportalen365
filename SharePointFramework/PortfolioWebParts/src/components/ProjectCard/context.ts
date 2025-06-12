import { createContext, useContext } from 'react'
import { IProjectCardProps, IProjectCardState } from './types'

export interface IProjectCardContext {
  props: IProjectCardProps
  state: IProjectCardState
  setState: (newState: Partial<IProjectCardState>) => void
}

export const ProjectCardContext = createContext<IProjectCardContext>(null)

/**
 * Hook to get the `ProjectCardContext`
 */
export function useProjectCardContext() {
  return useContext(ProjectCardContext)
}
