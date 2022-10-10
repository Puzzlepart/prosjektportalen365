import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SearchResult } from '@pnp/sp'
import { SPDataAdapter } from 'data'
import { IColumn, MessageBarType } from 'office-ui-fabric-react'

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
  childProjects: Array<Record<string, string>>

  /**
   * True if `AddProjectDialog` should be displayed to the user
   */
  displayAddProjectDialog: boolean

  /**
   * Projects available to add to parent project
   */
  availableProjects: SearchResult[]

  /**
   * Projects selected by user for deletion
   */
  selectedProjectsToDelete: Array<Record<string, string>>

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
