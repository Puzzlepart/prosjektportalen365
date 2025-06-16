import { createContext, useContext } from 'react'
import { IProjectCardProps, IProjectCardState } from './types'
import { ProjectListModel } from 'pp365-shared-library'
import { ButtonProps } from '@fluentui/react-components'

export interface IProjectCardContext extends IProjectCardProps {
  state?: IProjectCardState
  setState?: (newState: Partial<IProjectCardState>) => void

  /**
   * Project model
   */
  project?: ProjectListModel

  /**
   * Actions to display in the footer of the card
   */
  actions?: ButtonProps[]

  /**
   * Controls when the shimmer is swapped with actual data through an animated transition
   */
  isDataLoaded?: boolean

  /**
   * Checks if the metadata with the given key should be displayed
   */
  shouldDisplay?: (key: string) => boolean
}

export const ProjectCardContext = createContext<IProjectCardContext>(null)

/**
 * Hook to get the `ProjectCardContext`
 */
export function useProjectCardContext() {
  return useContext(ProjectCardContext)
}
