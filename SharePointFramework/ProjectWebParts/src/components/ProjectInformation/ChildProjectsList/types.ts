/** Child project expansion state and the available projects. */
export interface IChildProjectsListState {
  projects: any[]

  shouldShowToggle: boolean

  /**
   * A boolean indicating whether to display all projects or just a subset (`props.rowLimit`)
   */
  viewAll: boolean
}
