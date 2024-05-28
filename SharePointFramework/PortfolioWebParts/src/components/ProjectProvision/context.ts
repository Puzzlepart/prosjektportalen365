import { createContext, useContext } from 'react'
import { IProjectProvisionProps, IProjectProvisionState } from './types'

export interface IProjectProvisionContext {
  props: IProjectProvisionProps
  state: IProjectProvisionState
  setState: (newState: Partial<IProjectProvisionState>) => void
  column: Map<string, any>
  setColumn: (key: string, value: any) => void
}

export const ProjectProvisionContext = createContext<IProjectProvisionContext>(null)

/**
 * Hook to get the `ProjectProvisionContext`
 */
export function useProjectProvisionContext() {
  return useContext(ProjectProvisionContext)
}
