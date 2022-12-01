import { MessageBarType } from '@fluentui/react'
import { IBaseProgramWebPartProps } from '../../webparts/baseProgramWebPart/types'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IProgramAdministrationProps extends IBaseProgramWebPartProps {}

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
  availableProjects: Record<string, any>[]

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
