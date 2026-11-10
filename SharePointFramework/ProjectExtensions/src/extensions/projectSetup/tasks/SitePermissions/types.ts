export interface IPermissionConfiguration {
  /**
   * SharePoint group name
   */
  groupName: string

  /**
   * Defines the SharePoint permission level for the project site.
   */
  permissionLevel: string

  /**
   * Where the group gets its permission (`GtPermissionScope`): on the project site (empty or
   * «Område»), or as read access to a shielded project's lists for project data only.
   */
  scope?: string
}
