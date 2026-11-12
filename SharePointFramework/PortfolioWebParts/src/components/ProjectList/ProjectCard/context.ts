import { ButtonProps } from '@fluentui/react-components'
import { ProjectColumn, ProjectListModel } from 'pp365-shared-library/lib/models'
import { createContext } from 'react'
import { IProjectListProps } from '../types'

/** A project's model, loading state and card-specific metadata and actions. */
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
   * Whether project data is ready; the card also waits for its image-loading state.
   */
  isDataLoaded?: boolean

  /**
   * Checks if the metadata with the given key should be displayed
   */
  shouldDisplay?: (key: string) => boolean

  /**
   * Project column configuration
   */
  projectColumns?: ProjectColumn[]

  /**
   * Primary field to show on the project card
   */
  primaryField?: string

  /**
   * Secondary field to show on the project card
   */
  secondaryField?: string

  /**
   * Primary userfield to show on the project card footer.
   */
  primaryUserField?: string

  /**
   * Secondary userfield to show on the project card footer.
   */
  secondaryUserField?: string
}

/** Project and display options shared by a card's header, content and footer. */
export const ProjectCardContext = createContext<IProjectCardContext>(null)
