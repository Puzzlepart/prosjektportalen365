import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPDataAdapter } from 'data'
import { IColumn, MessageBarType } from 'office-ui-fabric-react'
import { IChildProject } from 'types/IChildProject'

export interface IProgramAdministrationProps {
  title: string
  description: string
  context: WebPartContext
  dataAdapter: SPDataAdapter
}

export interface IProgramAdministrationState {
  /**
   * Loading state
   */
  loading: {
    root: boolean
    AddProjectDialog: boolean
  }

  /**
   * Child projects
   */
  childProjects: IChildProject[]

  /**
   * True if `AddProjectDialog` should be displayed to the user
   */
  displayAddProjectDialog: boolean

  /**
   * Projects available to add to parent project
   */
  availableProjects: any[]

  /**
   * Projects selected by user for deletion
   */
  selectedProjectsToDelete: IChildProject[]

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

export const shimmeredColumns: IColumn[] = [
  {
    key: 'Title',
    name: 'Tittel',
    isResizable: true,
    maxWidth: 250,
    minWidth: 100
  }
]
