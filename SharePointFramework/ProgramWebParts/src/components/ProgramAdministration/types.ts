import { MessageBarType } from '@fluentui/react'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPDataAdapter } from 'data'

export interface IProgramAdministrationProject {
  SiteId: string
  Title: string
  SPWebURL: string
}

export interface IProgramAdministrationProps {
  title: string
  description: string
  context: WebPartContext
  dataAdapter: SPDataAdapter
}

export interface IProgramAdministrationState {
  /**
   * Loading state for scopes `root` and `AddProjectDialog`
   */
  loading: {
    root: boolean
    AddProjectDialog: boolean
  }

  /**
   * Child projects
   */
  childProjects: Record<string, any>[]

  /**
   * True if `<AddProjectDialog />` should be displayed to the user
   */
  displayAddProjectDialog?: boolean

  /**
   * Projects available to add to parent project
   */
  availableProjects: IProgramAdministrationProject[]

  /**
   * Projects selected by user to add
   */
  selectedProjectsToAdd: Record<string, any>[]

  /**
   * Projects selected by user for deletion
   */
  selectedProjectsToDelete: Record<string, any>[]

  /**
   * User has manage permission, meaning `ChildProjectsAdmin`
   */
  userHasManagePermission?: boolean

  /**
   * Error message
   */
  error: {
    text: string
    messageBarType: MessageBarType
  }
}
