import { TableRowId } from '@fluentui/react-components'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPDataAdapter } from 'data/SPDataAdapter'

export interface IProgramAdministrationProject extends Record<string, any> {
  SiteId: string
  Title: string
  SPWebURL?: string
  Path?: string
}

export interface IProgramAdministrationProps {
  context: WebPartContext
  dataAdapter: SPDataAdapter
}

export interface IProgramAdministrationState {
  /**
   * Loading state
   */
  loading: boolean

  /**
   * Child projects
   */
  childProjects: Record<string, any>[]

  /**
   * Properties for the add project dialog
   */
  addProjectDialog?: {
    /**
     * Dialog open state
     */
    open: boolean

    /**
     * Loading state
     */
    loading: boolean

    /**
     * Projects selected by user to add
     */
    selectedProjects: TableRowId[]
  }

  /**
   * Projects available to add to parent project
   */
  availableProjects: IProgramAdministrationProject[]

  /**
   * Projects selected by user for deletion
   */
  selectedProjects: TableRowId[]

  /**
   * User has manage permission, meaning `ChildProjectsAdmin`
   */
  userHasManagePermission?: boolean

  /**
   * Indicates whether the component is deleting projects
   */
  isDeleting: boolean

  /**
   * Error message
   */
  error: string
}
