export type ActionType = [string, string | (() => void), string, boolean?, boolean?]

export interface IActionsProps {
  /**
   * Should the actions be hidden
   */
  hidden: boolean

  /**
   * Version history URL
   */
  versionHistoryUrl: string

  /**
   * Edit form URL
   */
  editFormUrl: string

  /**
   * Custom actions
   */
  customActions?: ActionType[]

  /**
   * Current user has admin permissions
   */
   userHasAdminPermission?: boolean
}
