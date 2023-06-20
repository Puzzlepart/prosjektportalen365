import { IButtonProps } from '@fluentui/react/lib/Button'
import { createContext } from 'react'
import { IProjectListProps } from '../types'
import { ProjectListModel } from 'pp365-shared-library/lib/models'

export interface IProjectCardContext
  extends Pick<IProjectListProps, 'showProjectLogo' | 'showProjectOwner' | 'showProjectManager'> {
  /**
   * Project model
   */
  project?: ProjectListModel

  /**
   * Should the title be truncated
   */
  shouldTruncateTitle?: boolean

  /**
   * Actions to display in the footer of the card
   */
  actions?: IButtonProps[]

  /**
   * Controls when the shimmer is swapped with actual data through an animated transition
   */
  isDataLoaded?: boolean
}

export const ProjectCardContext = createContext<IProjectCardContext>(null)
