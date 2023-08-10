import { createContext } from 'react'
import { IProjectListProps } from '../types'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { ButtonProps } from '@fluentui/react-components'

export interface IProjectCardContext
  extends Pick<
    IProjectListProps,
    'showProjectLogo' | 'showProjectOwner' | 'showProjectManager' | 'useDynamicColors'
  > {
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
}

export const ProjectCardContext = createContext<IProjectCardContext>(null)
