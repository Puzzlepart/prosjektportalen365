/** Hub group and permission level to reproduce on the project site. */
export interface IPermissionConfiguration {
  groupName: string

  permissionLevel: string

  /**
   * Where the group gets its permission (`GtPermissionScope`): on the project site (empty or
   * «Område»), or as read access to a shielded project's lists for project data only.
   */
  scope?: string
}
