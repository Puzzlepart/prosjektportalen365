import { createContext, useContext } from 'react'
import { IProjectCardProps, IProjectCardState } from './types'
import { ProjectListModel } from 'pp365-shared-library'

/** Card configuration and the selected project, with optional shared state updates. */
export interface IProjectCardContext extends IProjectCardProps {
  state?: IProjectCardState
  setState?: (newState: Partial<IProjectCardState>) => void
  project?: ProjectListModel
}

/** Project-card configuration and model shared with its content. */
export const ProjectCardContext = createContext<IProjectCardContext>(null)

/**
 * Hook to get the `ProjectCardContext`
 */
export function useProjectCardContext() {
  return useContext(ProjectCardContext)
}
