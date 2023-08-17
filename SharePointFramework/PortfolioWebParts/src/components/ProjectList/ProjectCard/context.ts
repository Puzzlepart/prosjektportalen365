import { ButtonProps } from '@fluentui/react-components'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { createContext } from 'react'
import { IProjectListProps } from '../types'

export interface IProjectCardContext extends IProjectListProps {
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
